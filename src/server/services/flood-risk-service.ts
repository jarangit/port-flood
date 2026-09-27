import type { CurrentStatus } from "@/config/status-levels";
import { fetchElevation } from "@/server/external/opentopodata/client";
import { fetchNearestWaterway } from "@/server/external/overpass/client";
import { fetchFloodHistory } from "@/server/external/gistda/client";
import type {
  NearbyRainStation,
  NearbyWaterStation,
} from "@/server/external/thaiwater/mapper";
import { estimateFloodDepth } from "@/server/services/depth-estimate-service";
import type {
  FloodRiskResponse,
  LocationContext,
  OfficialAlert,
  RiskFactor,
  SafetySeverity,
} from "@/server/services/types";

export type RealtimeRiskInput = {
  stations: NearbyWaterStation[];
  rainfall: NearbyRainStation[];
  summaryStatus: CurrentStatus;
};

const severityRank: Record<CurrentStatus, number> = {
  normal: 0,
  watch: 1,
  warning: 2,
  critical: 3,
};

function worstStatus(statuses: CurrentStatus[]): CurrentStatus {
  return statuses.reduce<CurrentStatus>(
    (max, status) => (severityRank[status] > severityRank[max] ? status : max),
    "normal",
  );
}

function staticScoreToBaselineRisk(staticScore: number): FloodRiskResponse["baselineRisk"] {
  if (staticScore >= 50) return "very_high";
  if (staticScore >= 35) return "high";
  if (staticScore >= 15) return "medium";
  return "low";
}

function factor(
  type: string,
  label: string,
  severity: SafetySeverity,
  source: string,
): RiskFactor {
  return { type, label, severity, source };
}

/**
 * Composite flood-risk score from real signals.
 *
 * baselineRisk comes only from slow-changing signals (flood history,
 * elevation, nearby waterway), while riskScore adds live modifiers
 * (water level, rainfall, official alerts) on top.
 */
export async function getFloodRisk(
  lat: number,
  lng: number,
  location?: LocationContext,
  alertsInput?: { alerts: OfficialAlert[]; sourceStatus: "live" | "fallback" },
  realtimeInput?: RealtimeRiskInput,
): Promise<FloodRiskResponse> {
  const stations = realtimeInput?.stations ?? [];
  const rainfall = realtimeInput?.rainfall ?? [];

  const [elevation, waterway, history] = await Promise.all([
    fetchElevation(lat, lng),
    fetchNearestWaterway(lat, lng),
    fetchFloodHistory(lat, lng),
  ]);

  const depth = estimateFloodDepth(stations, rainfall, { elevationM: elevation.elevationM });

  const factors: RiskFactor[] = [];
  let staticScore = 0;
  let missingSources = 0;

  if (history.floodFreq === null) {
    missingSources += 1;
    factors.push(
      factor(
        "historical_flood",
        "ดึงข้อมูลประวัติน้ำท่วมไม่ได้ชั่วคราว จึงยังไม่นับข้อนี้ในคะแนน",
        "info",
        "GISTDA",
      ),
    );
  } else if (history.floodFreq >= 3) {
    staticScore += 35;
    factors.push(
      factor(
        "historical_flood",
        `จุดนี้อยู่ในพื้นที่น้ำท่วมซ้ำซาก ท่วม ${history.floodFreq} ครั้งในช่วง 2548-2559${history.areaName ? ` (ต.${history.areaName})` : ""}`,
        "critical",
        "GISTDA พื้นที่น้ำท่วมซ้ำซาก 2548-2559",
      ),
    );
  } else if (history.floodFreq >= 1) {
    staticScore += 25;
    factors.push(
      factor(
        "historical_flood",
        `จุดนี้เคยมีน้ำท่วม ${history.floodFreq} ครั้งในช่วง 2548-2559 (${history.floodYears.join(", ") || "ไม่ระบุปี"})`,
        "warning",
        "GISTDA พื้นที่น้ำท่วมซ้ำซาก 2548-2559",
      ),
    );
  } else {
    factors.push(
      factor(
        "historical_flood",
        "จุดนี้ไม่อยู่ในชั้นข้อมูลพื้นที่น้ำท่วมซ้ำซาก 2548-2559 (ข้อมูลมาตราส่วน 1:50,000)",
        "info",
        "GISTDA พื้นที่น้ำท่วมซ้ำซาก 2548-2559",
      ),
    );
  }

  if (elevation.elevationM === null) {
    missingSources += 1;
    factors.push(
      factor(
        "elevation",
        "ดึงข้อมูลระดับความสูงไม่ได้ชั่วคราว จึงยังไม่นับข้อนี้ในคะแนน",
        "info",
        "OpenTopoData",
      ),
    );
  } else if (elevation.elevationM < 5) {
    staticScore += 20;
    factors.push(
      factor(
        "elevation",
        `พื้นที่ต่ำประมาณ ${elevation.elevationM} ม. จากระดับน้ำทะเล น้ำมีโอกาสขังนาน`,
        "warning",
        "OpenTopoData SRTM 30 ม.",
      ),
    );
  } else if (elevation.elevationM < 15) {
    staticScore += 12;
    factors.push(
      factor(
        "elevation",
        `พื้นที่สูงประมาณ ${elevation.elevationM} ม. จากระดับน้ำทะเล`,
        "watch",
        "OpenTopoData SRTM 30 ม.",
      ),
    );
  } else if (elevation.elevationM < 30) {
    staticScore += 5;
    factors.push(
      factor(
        "elevation",
        `พื้นที่สูงประมาณ ${elevation.elevationM} ม. จากระดับน้ำทะเล`,
        "info",
        "OpenTopoData SRTM 30 ม.",
      ),
    );
  } else {
    factors.push(
      factor(
        "elevation",
        `พื้นที่สูงประมาณ ${elevation.elevationM} ม. จากระดับน้ำทะเล ช่วยลดโอกาสน้ำขัง`,
        "info",
        "OpenTopoData SRTM 30 ม.",
      ),
    );
  }

  if (waterway.distanceM === null) {
    missingSources += 1;
    factors.push(
      factor(
        "near_waterway",
        "ดึงข้อมูลทางน้ำใกล้เคียงไม่ได้ชั่วคราว จึงยังไม่นับข้อนี้ในคะแนน",
        "info",
        "OpenStreetMap",
      ),
    );
  } else if (waterway.distanceM < 500) {
    staticScore += 15;
    factors.push(
      factor(
        "near_waterway",
        `มีทางน้ำห่างประมาณ ${waterway.distanceM} ม. ควรระวังเวลาน้ำในคลอง/แม่น้ำสูง`,
        "watch",
        "OpenStreetMap",
      ),
    );
  } else if (waterway.distanceM < 1500) {
    staticScore += 8;
    factors.push(
      factor(
        "near_waterway",
        `มีทางน้ำห่างประมาณ ${waterway.distanceM} ม.`,
        "info",
        "OpenStreetMap",
      ),
    );
  } else {
    factors.push(
      factor(
        "near_waterway",
        `ทางน้ำใกล้สุดห่างประมาณ ${waterway.distanceM} ม. (เกิน 1.5 กม.)`,
        "info",
        "OpenStreetMap",
      ),
    );
  }

  const worstWater = worstStatus(stations.map((station) => station.status));
  const worstRain = worstStatus(rainfall.map((station) => station.status));
  const liveWaterPoints = { normal: 0, watch: 5, warning: 10, critical: 15 } as const;
  const liveRainPoints = { normal: 0, watch: 3, warning: 7, critical: 10 } as const;
  const livePoints = liveWaterPoints[worstWater] + liveRainPoints[worstRain];

  if (stations.length === 0 && rainfall.length === 0) {
    missingSources += 1;
    factors.push(
      factor(
        "live_water",
        "ไม่มีสถานีตรวจวัดในรัศมีใกล้เคียง จึงยังไม่นับสัญญาณปัจจุบันในคะแนน",
        "info",
        "ThaiWater",
      ),
    );
  } else {
    factors.push(
      factor(
        "live_water",
        stations.length > 0
          ? `สถานีระดับน้ำใกล้สุด ${stations.length} จุด สัญญาณแรงสุดระดับ${worstWater}`
          : "ไม่มีสถานีระดับน้ำในรัศมีใกล้เคียง",
        worstWater === "normal" ? "info" : worstWater,
        "ThaiWater",
      ),
    );
    factors.push(
      factor(
        "live_rain",
        rainfall.length > 0
          ? `สถานีฝนใกล้สุด ${rainfall.length} จุด สัญญาณแรงสุดระดับ${worstRain}`
          : "ไม่มีสถานีฝนในรัศมีใกล้เคียง",
        worstRain === "normal" ? "info" : worstRain,
        "ThaiWater",
      ),
    );
  }

  const hasAlert = (alertsInput?.alerts ?? []).length > 0;
  if (hasAlert) {
    factors.push(
      factor(
        "official_alert",
        "ขณะนี้มีประกาศเตือนภัยจากหน่วยงานรัฐ โปรดอ่านรายละเอียดด้านบน",
        "warning",
        "TMD",
      ),
    );
  }

  factors.push(
    factor(
      "depth_estimate",
      depth.displaySource === "nearest_station_bank_diff" && depth.displayDepthCm !== null
        ? `ระดับน้ำจริงที่สถานีใกล้สุด: น้ำ${depth.displayLabel}`
        : depth.depthCm === null
          ? "ประเมินความลึกไม่ได้เพราะไม่มีสถานีใกล้เคียง"
          : `ความลึกโดยประมาณ ${depth.bandLabel} จากสถานีใกล้เคียง`,
      (depth.displayDepthCm ?? depth.depthCm ?? 0) >= 50 ||
      depth.band === "50-100" ||
      depth.band === "above-100"
        ? "warning"
        : "info",
      "ThaiWater",
    ),
  );
  if (depth.localSignal !== "unknown") {
    factors.push(
      factor(
        "local_flood_signal",
        `สัญญาณน้ำในพื้นที่: ${depth.localSignalLabel}`,
        depth.localSignal === "severe_watch"
          ? "critical"
          : depth.localSignal === "road_flood_possible"
            ? "warning"
            : depth.localSignal === "ponding_possible"
              ? "watch"
              : "info",
        "ThaiWater",
      ),
    );
  }

  const riskScore = Math.min(100, staticScore + livePoints + (hasAlert ? 5 : 0));
  const confidence = missingSources === 0 ? "high" : missingSources === 1 ? "medium" : "low";

  return {
    location: location ?? {
      lat,
      lng,
      province: "ยังไม่มีข้อมูลจังหวัด",
      district: "ยังไม่มีข้อมูลอำเภอ/เขต",
      subdistrict: "ยังไม่มีข้อมูลตำบล/แขวง",
      basin: "ยังไม่มีข้อมูลลุ่มน้ำ",
    },
    baselineRisk: staticScoreToBaselineRisk(staticScore),
    currentStatus: realtimeInput?.summaryStatus ?? "normal",
    estimatedDepthCm: depth.depthCm,
    depthBandLabel: depth.bandLabel,
    driverName: depth.driverName,
    driverBankDiffM: depth.driverBankDiffM,
    stationWaterLevelMsl: depth.stationWaterLevelMsl,
    userElevationM: depth.userElevationM,
    surfaceWaterCm: depth.surfaceWaterCm,
    surfaceSource: depth.surfaceSource,
    localSignal: depth.localSignal,
    localSignalLabel: depth.localSignalLabel,
    displayDepthCm: depth.displayDepthCm,
    displayLabel: depth.displayLabel,
    displaySource: depth.displaySource,
    depthBasis: depth.basis,
    riskScore,
    confidence,
    factors,
    alerts: alertsInput?.alerts ?? [],
    alertsSourceStatus: alertsInput?.sourceStatus ?? "fallback",
    updatedAt: new Date().toISOString(),
    disclaimer: "คะแนนนี้ประเมินจากข้อมูลเปิดเพื่อการเตรียมพร้อม ไม่ใช่คำสั่งอพยพ โปรดติดตามประกาศจากหน่วยงานรัฐเสมอ",
  };
}
