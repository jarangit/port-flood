import { currentStatusLabels, type CurrentStatus } from "@/config/status-levels";
import { riskLevelLabels, type RiskLevel } from "@/config/risk-levels";
import { isCoordinateInThailand } from "@/lib/validation";
import { fetchDirections } from "@/server/external/openrouteservice/client";
import { fetchRainfall24h, fetchWaterLevels } from "@/server/external/thaiwater/client";
import { getOfficialAlerts } from "@/server/services/alert-service";
import { getFloodRisk } from "@/server/services/flood-risk-service";
import { reverseGeocodeThailand } from "@/server/services/geocoding-service";
import { summarizeRealtimeNearby } from "@/server/services/realtime-service";
import { sampleRoute } from "@/server/services/route-sampling-service";
import type {
  RouteRiskRequest,
  RouteRiskResponse,
  RouteRiskSegment,
  RouteSamplePoint,
  TravelMode,
} from "@/server/services/route-risk-types";

const MAX_DISTANCE_KM = Number(process.env.ROUTE_RISK_MAX_DISTANCE_KM ?? 100);
const MAX_SAMPLE_POINTS = Number(process.env.ROUTE_RISK_MAX_SAMPLE_POINTS ?? 60);
// Bounded parallelism: Overpass asks for effectively serial use and Nominatim
// allows ~1 req/s, so never fan out to all samples at once.
const SAMPLE_CONCURRENCY = Number(process.env.ROUTE_RISK_SAMPLE_CONCURRENCY ?? 6);
const LABEL_CONCURRENCY = Number(process.env.ROUTE_RISK_LABEL_CONCURRENCY ?? 3);

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Math.max(1, Math.min(limit, items.length));

  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await fn(items[index], index);
      }
    }),
  );

  return results;
}

const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, very_high: 3 };
const statusRank: Record<CurrentStatus, number> = { normal: 0, watch: 1, warning: 2, critical: 3 };

function assertRoutePoint(point: RouteRiskRequest["origin"], name: string) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    throw new Error(`${name} coordinates are invalid`);
  }
  if (!isCoordinateInThailand(point.lat, point.lng)) {
    throw new Error(`${name} must be in Thailand`);
  }
}

function assertMode(mode: string): asserts mode is TravelMode {
  if (mode !== "car" && mode !== "motorcycle") {
    throw new Error("mode must be car or motorcycle");
  }
}

function segmentLabel(risk: RiskLevel, status: CurrentStatus) {
  if (riskRank[risk] >= 2 || statusRank[status] >= 2) {
    return `${riskLevelLabels[risk]} · ${currentStatusLabels[status]}`;
  }
  if (risk !== "low" || status !== "normal") {
    return `${riskLevelLabels[risk]} · ควรติดตาม`;
  }
  return "ผ่านได้ตามปกติ แต่ควรติดตามข่าว";
}

function importantReasons(factors: { label: string; severity: string }[]) {
  const severityOrder = { critical: 0, warning: 1, watch: 2, info: 3 } as const;
  return [...factors]
    .sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder])
    .slice(0, 3)
    .map((factor) => factor.label);
}

function vehicleImpactLabel(mode: TravelMode, depthCm: number | null, label: string) {
  if (depthCm === null) return "ยังไม่มีค่าระดับน้ำใกล้เส้นทางนี้";
  if (label.includes("ต่ำกว่าตลิ่ง")) return "ยังไม่ล้นตลิ่ง แต่ควรติดตาม";

  if (mode === "motorcycle") {
    if (depthCm >= 25) return "ไม่ควรผ่านสำหรับมอไซค์";
    if (depthCm >= 10) return "อันตรายสำหรับมอไซค์";
    return "เริ่มเสี่ยงลื่นหรือเจอหลุม";
  }

  if (depthCm >= 60) return "ไม่ควรขับผ่าน";
  if (depthCm >= 40) return "เสี่ยงดับกลางน้ำ";
  if (depthCm >= 25) return "ใกล้ขอบประตูรถเล็ก";
  if (depthCm >= 10) return "ประมาณครึ่งล้อ";
  return "ต่ำกว่าขอบล้อ";
}

function strongestVehicleWater(
  current: RouteRiskSegment["vehicleWater"],
  next: RouteRiskSegment["vehicleWater"],
) {
  if (current.depthCm === null) return next;
  if (next.depthCm === null) return current;
  return next.depthCm > current.depthCm ? next : current;
}

function formatClearance(clearanceM: number) {
  const abs = Math.abs(clearanceM);
  if (abs >= 1) return `${abs.toFixed(1)} ม.`;
  return `${Math.round(abs * 100)} ซม.`;
}

function buildRoadWaterEstimate(args: {
  roadElevationM: number | null;
  nearestWaterLevelMsl: number | null;
  stationDistanceKm: number | null;
}): RouteRiskSegment["roadWaterEstimate"] {
  const { roadElevationM, nearestWaterLevelMsl, stationDistanceKm } = args;

  if (roadElevationM === null || nearestWaterLevelMsl === null) {
    return {
      roadElevationM,
      nearestWaterLevelMsl,
      clearanceM: null,
      stationDistanceKm,
      label: "ยังประเมินระดับถนนเทียบน้ำไม่ได้",
      confidence: "low",
      source: "unavailable",
    };
  }

  const clearanceM = Math.round((roadElevationM - nearestWaterLevelMsl) * 100) / 100;
  const confidence =
    stationDistanceKm !== null && stationDistanceKm <= 3
      ? "high"
      : stationDistanceKm !== null && stationDistanceKm <= 10
        ? "medium"
        : "low";

  return {
    roadElevationM,
    nearestWaterLevelMsl,
    clearanceM,
    stationDistanceKm,
    label:
      clearanceM <= 0
        ? `ระดับน้ำสถานีใกล้สุดสูงกว่าถนนโดยประมาณ ${formatClearance(clearanceM)}`
        : `ถนนสูงกว่าระดับน้ำสถานีใกล้สุดประมาณ ${formatClearance(clearanceM)}`,
    confidence,
    source: "road_elevation_vs_station_water_level",
  };
}

function lowestRoadClearance(
  current: RouteRiskSegment["roadWaterEstimate"],
  next: RouteRiskSegment["roadWaterEstimate"],
) {
  if (current.clearanceM === null) return next;
  if (next.clearanceM === null) return current;
  return next.clearanceM < current.clearanceM ? next : current;
}

type SegmentAssessment = Omit<
  RouteRiskSegment,
  "startKm" | "endKm" | "startTimeMin" | "endTimeMin" | "startLabel" | "endLabel"
> & {
  pointLabel: string;
};

function sampleFallbackLabel(point: RouteSamplePoint) {
  return `กม. ${point.distanceKm}`;
}

function concisePlaceLabel(displayName: string, fallbackParts: string[]) {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        part !== "ประเทศไทย" &&
        part.toLowerCase() !== "thailand" &&
        !/^\d{5}$/.test(part),
    );
  const adminWords = ["เทศบาล", "อำเภอ", "เขต", "จังหวัด", "ตำบล", "แขวง"];
  const firstSpecificIndex = parts.findIndex(
    (part) => !adminWords.some((word) => part.includes(word)),
  );
  const startIndex = firstSpecificIndex >= 0 ? firstSpecificIndex : 0;
  const specificParts = parts.slice(startIndex, startIndex + 2);

  if (specificParts.length > 0) {
    return specificParts.join(" · ");
  }

  return fallbackParts.filter((part) => part && !part.startsWith("ไม่ทราบ")).slice(0, 2).join(" · ");
}

async function getSampleLabel(point: RouteSamplePoint) {
  try {
    const result = await reverseGeocodeThailand(point.lat, point.lng, 18);
    if ("error" in result) return sampleFallbackLabel(point);
    const { subdistrict, district, province } = result.location;
    const area = concisePlaceLabel(result.label, [subdistrict, district, province]);
    return area ? `กม. ${point.distanceKm} · ${area}` : sampleFallbackLabel(point);
  } catch {
    return sampleFallbackLabel(point);
  }
}

type MergedSegment = {
  segment: RouteRiskSegment;
  startIndex: number;
  endIndex: number;
};

function mergeRawSegments(points: RouteSamplePoint[], items: SegmentAssessment[]) {
  const merged: MergedSegment[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const point = points[index];
    const nextPoint = points[index + 1] ?? point;
    const item = items[index];
    const last = merged.at(-1);

    if (last && last.segment.risk === item.risk && last.segment.status === item.status) {
      last.segment.endKm = nextPoint.distanceKm;
      last.segment.endTimeMin = nextPoint.timeMin;
      last.endIndex = index;
      last.segment.reasons = Array.from(
        new Set([...last.segment.reasons, ...item.reasons]),
      ).slice(0, 4);
      last.segment.vehicleWater = strongestVehicleWater(last.segment.vehicleWater, item.vehicleWater);
      last.segment.roadWaterEstimate = lowestRoadClearance(
        last.segment.roadWaterEstimate,
        item.roadWaterEstimate,
      );
      continue;
    }

    merged.push({
      segment: {
        startKm: point.distanceKm,
        endKm: nextPoint.distanceKm,
        startTimeMin: point.timeMin,
        endTimeMin: nextPoint.timeMin,
        startLabel: "",
        endLabel: "",
        risk: item.risk,
        status: item.status,
        label: item.label,
        reasons: item.reasons,
        vehicleWater: item.vehicleWater,
        roadWaterEstimate: item.roadWaterEstimate,
      },
      startIndex: index,
      endIndex: index,
    });
  }

  return merged.filter((entry) => entry.segment.endKm > entry.segment.startKm);
}

async function labelMergedSegments(points: RouteSamplePoint[], merged: MergedSegment[]) {
  await mapWithConcurrency(merged, LABEL_CONCURRENCY, async (entry) => {
    const endSample = points[entry.endIndex + 1] ?? points[entry.endIndex];
    const [startLabel, endLabel] = await Promise.all([
      getSampleLabel(points[entry.startIndex]),
      getSampleLabel(endSample),
    ]);
    entry.segment.startLabel = startLabel;
    entry.segment.endLabel = endLabel;
  });

  return merged.map((entry) => entry.segment);
}

function buildMapSegments(points: RouteSamplePoint[], items: SegmentAssessment[]) {
  return items
    .map<RouteRiskSegment>((item, index) => {
      const point = points[index];
      const nextPoint = points[index + 1] ?? point;

      return {
        startKm: point.distanceKm,
        endKm: nextPoint.distanceKm,
        startTimeMin: point.timeMin,
        endTimeMin: nextPoint.timeMin,
        // Map-only segments never hit reverse-geocode; labels stay as km markers.
        startLabel: sampleFallbackLabel(point),
        endLabel: sampleFallbackLabel(nextPoint),
        risk: item.risk,
        status: item.status,
        label: item.label,
        reasons: item.reasons,
        vehicleWater: item.vehicleWater,
        roadWaterEstimate: item.roadWaterEstimate,
      };
    })
    .filter((segment) => segment.endKm > segment.startKm);
}

export async function getRouteRisk(request: RouteRiskRequest): Promise<RouteRiskResponse> {
  assertMode(request.mode);
  assertRoutePoint(request.origin, "origin");
  assertRoutePoint(request.destination, "destination");

  const route = await fetchDirections({
    origin: request.origin,
    destination: request.destination,
    mode: request.mode,
  });

  if (route.distanceKm > MAX_DISTANCE_KM) {
    throw new Error(`Route distance ${route.distanceKm} km is over the ${MAX_DISTANCE_KM} km limit`);
  }

  const samples = sampleRoute({
    coordinates: route.coordinates,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    maxSamples: MAX_SAMPLE_POINTS,
  });
  const officialAlerts = await getOfficialAlerts();
  // ThaiWater publishes national snapshots; fetch once and map nearby per sample.
  const [waterLevels, rainfallRows] = await Promise.all([fetchWaterLevels(), fetchRainfall24h()]);

  const assessments = await mapWithConcurrency(samples, SAMPLE_CONCURRENCY, async (sample) => {
    const realtime = summarizeRealtimeNearby(waterLevels, rainfallRows, sample.lat, sample.lng);
    const risk = await getFloodRisk(
      sample.lat,
      sample.lng,
      {
        lat: sample.lat,
        lng: sample.lng,
        province: "ระหว่างเส้นทาง",
        district: `กม. ${sample.distanceKm}`,
        subdistrict: "จุดตรวจเส้นทาง",
        basin: "ยังไม่มีข้อมูลลุ่มน้ำ",
      },
      officialAlerts,
      {
        stations: realtime.stations,
        rainfall: realtime.rainfall,
        summaryStatus: realtime.summaryStatus,
      },
    );

    const stationDistanceKm = realtime.stations[0]?.distanceKm ?? null;

    return {
      pointLabel: "",
      risk: risk.baselineRisk,
      status: realtime.summaryStatus,
      label: segmentLabel(risk.baselineRisk, realtime.summaryStatus),
      reasons: importantReasons(risk.factors),
      vehicleWater: {
        depthCm: risk.displayDepthCm ?? null,
        label: risk.displayLabel ?? "ไม่มีข้อมูล",
        source: risk.displaySource ?? "unknown",
        impactLabel: vehicleImpactLabel(request.mode, risk.displayDepthCm ?? null, risk.displayLabel ?? ""),
      },
      roadWaterEstimate: buildRoadWaterEstimate({
        roadElevationM: risk.userElevationM ?? null,
        nearestWaterLevelMsl: risk.stationWaterLevelMsl ?? null,
        stationDistanceKm,
      }),
    };
  });

  // Reverse-geocode only merged timeline boundaries instead of every sample.
  const segments = await labelMergedSegments(samples, mergeRawSegments(samples, assessments));

  return {
    origin: request.origin,
    destination: request.destination,
    mode: request.mode,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    sampleCount: samples.length,
    source: "openrouteservice",
    coordinates: route.coordinates,
    mapSegments: buildMapSegments(samples, assessments),
    disclaimer:
      request.mode === "motorcycle"
        ? "เส้นทางมอไซค์ใช้ข้อมูลเส้นทางรถยนต์เป็นค่าประมาณ ถนนจริงและข้อจำกัดมอไซค์อาจต่างกัน ผลนี้ใช้เพื่อวางแผน ไม่ใช่คำสั่งปิดถนนหรือคำสั่งอพยพ"
        : "ผลนี้ใช้เพื่อวางแผนก่อนเดินทาง ไม่ใช่คำสั่งปิดถนนหรือคำสั่งอพยพ โปรดตรวจประกาศรัฐและสภาพถนนจริงเสมอ",
    segments,
  };
}
