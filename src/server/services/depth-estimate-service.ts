import type {
  NearbyRainStation,
  NearbyWaterStation,
} from "@/server/external/thaiwater/mapper";

export type DepthBand = "below-20" | "20-50" | "50-100" | "above-100" | "unknown";

export type LocalFloodSignal =
  | "none"
  | "ponding_possible"
  | "road_flood_possible"
  | "severe_watch"
  | "unknown";

export type DepthEstimate = {
  /** Band midpoint in cm, for the illustration figure and API compatibility only. */
  depthCm: number | null;
  band: DepthBand;
  /** Honest display text, e.g. "เกิน 100 ซม." — prefer this over depthCm in UI copy. */
  bandLabel: string;
  driverName: string | null;
  driverBankDiffM: number | null;
  stationWaterLevelMsl: number | null;
  userElevationM: number | null;
  surfaceWaterCm: number | null;
  surfaceSource: "msl_minus_elevation" | "unavailable";
  localSignal: LocalFloodSignal;
  localSignalLabel: string;
  displayDepthCm: number | null;
  displayLabel: string;
  displaySource: "nearest_station_bank_diff" | "fallback_estimate" | "unknown";
  basis: string[];
  confidence: "low" | "medium";
};

const BAND_MIDPOINT_CM: Record<Exclude<DepthBand, "unknown">, number> = {
  "below-20": 10,
  "20-50": 35,
  "50-100": 75,
  "above-100": 130,
};

export const DEPTH_BAND_LABEL: Record<DepthBand, string> = {
  "below-20": "ต่ำกว่า 20 ซม.",
  "20-50": "20-50 ซม.",
  "50-100": "50-100 ซม.",
  "above-100": "เกิน 100 ซม.",
  unknown: "ไม่ทราบ",
};

// A far-away overflowing station says less about the user's exact point,
// so its overflow contribution is discounted by distance tier.
function distanceWeight(distanceKm: number): number {
  if (distanceKm <= 3) return 1;
  if (distanceKm <= 10) return 0.7;
  return 0.4;
}

// Thai rainfall criteria (mm/24h): heavy 35.1-90, very heavy >90.
// Rain is areal, so unlike station overflow it is not distance-discounted.
function rainAdderCm(rain24h: number): number {
  if (rain24h > 90) return 60;
  if (rain24h >= 35.1) return 30;
  if (rain24h >= 10) return 10;
  return 0;
}

function bandFor(totalCm: number): Exclude<DepthBand, "unknown"> {
  if (totalCm > 100) return "above-100";
  if (totalCm >= 50) return "50-100";
  if (totalCm >= 20) return "20-50";
  return "below-20";
}

/**
 * Transparent heuristic that turns nearby live station readings into a depth
 * band for the illustration. This is an approximation from nearby stations,
 * never a measurement at the user's exact location.
 */
function formatMeterCm(cm: number): string {
  const absCm = Math.round(Math.abs(cm));
  if (absCm >= 100) return `${(absCm / 100).toFixed(1)} ม.`;
  return `${absCm} ซม.`;
}

export function estimateFloodDepth(
  stations: NearbyWaterStation[],
  rainfall: NearbyRainStation[],
  context?: { elevationM?: number | null },
): DepthEstimate {
  if (stations.length === 0 && rainfall.length === 0) {
    return {
      depthCm: null,
      band: "unknown",
      bandLabel: DEPTH_BAND_LABEL.unknown,
      driverName: null,
      driverBankDiffM: null,
      stationWaterLevelMsl: null,
      userElevationM: context?.elevationM ?? null,
      surfaceWaterCm: null,
      surfaceSource: "unavailable",
      localSignal: "unknown",
      localSignalLabel: "ยังประเมินสัญญาณน้ำในพื้นที่ไม่ได้",
      displayDepthCm: null,
      displayLabel: "ไม่มีข้อมูล",
      displaySource: "unknown",
      basis: ["ไม่พบสถานีตรวจวัดระดับน้ำหรือฝนในรัศมีที่ค้นหา จึงประเมินความลึกไม่ได้"],
      confidence: "low",
    };
  }

  const nearestStation = stations[0] ?? null;
  let weightedOverflowCm = 0;
  let driverStation: NearbyWaterStation | null = nearestStation;
  let driverWeight = 1;
  let usedFallbackStation = false;

  if (nearestStation?.bankDiffM !== undefined) {
    weightedOverflowCm = Math.max(0, nearestStation.bankDiffM * 100);
  } else {
    driverStation = null;
    for (const station of stations) {
      if (station.bankDiffM !== undefined && station.bankDiffM > 0) {
        const weighted = station.bankDiffM * 100 * distanceWeight(station.distanceKm);
        if (weighted > weightedOverflowCm) {
          weightedOverflowCm = weighted;
          driverStation = station;
          driverWeight = distanceWeight(station.distanceKm);
          usedFallbackStation = true;
        }
      }
    }
  }

  let maxRain = 0;
  let maxRainStation: NearbyRainStation | null = null;
  for (const station of rainfall) {
    if (station.rain24h !== undefined && station.rain24h > maxRain) {
      maxRain = station.rain24h;
      maxRainStation = station;
    }
  }

  const basis: string[] = [];
  if (driverStation?.bankDiffM !== undefined) {
    const trendText =
      driverStation.trendM === undefined
        ? ""
        : driverStation.trendM > 0.05
          ? ` สูงขึ้น ${driverStation.trendM} ม.จากครั้งก่อน`
          : driverStation.trendM < -0.05
            ? ` ลดลง ${Math.abs(driverStation.trendM)} ม.จากครั้งก่อน`
            : " ทรงตัวจากครั้งก่อน";
    basis.push(
      `${usedFallbackStation ? "สถานีใกล้สุดไม่มีข้อมูลตลิ่ง จึงใช้ " : "ใช้สถานีใกล้สุด "}${driverStation.name} ` +
        `${driverStation.bankDiffM >= 0 ? "สูงกว่าตลิ่ง" : "ต่ำกว่าตลิ่ง"} ${Math.abs(driverStation.bankDiffM).toFixed(2)} ม.` +
        ` ห่างประมาณ ${driverStation.distanceKm} กม.${trendText}` +
        (driverWeight < 1 ? " (สถานีอยู่ไกล จึงลดน้ำหนักลง)" : ""),
    );
  } else if (nearestStation) {
    basis.push(`สถานีใกล้สุด ${nearestStation.name} ห่างประมาณ ${nearestStation.distanceKm} กม. แต่ไม่มีข้อมูลเทียบตลิ่ง`);
  } else if (stations.length > 0) {
    basis.push(`สถานีระดับน้ำใกล้สุด ${stations.length} จุด ยังไม่ล้นตลิ่ง`);
  }
  if (maxRainStation) {
    basis.push(
      `ฝน 24 ชม. สูงสุด ${maxRain} มม. ที่${maxRainStation.name} ห่างประมาณ ${maxRainStation.distanceKm} กม.`,
    );
  }

  const totalCm = weightedOverflowCm + rainAdderCm(maxRain);
  const band = bandFor(totalCm);

  const severeStations = stations.filter(
    (station) => station.status === "warning" || station.status === "critical",
  ).length;
  const agreeingSignals = [weightedOverflowCm > 0, maxRain >= 35.1, severeStations >= 2].filter(
    Boolean,
  ).length;

  const nearestBankDiffM = nearestStation?.bankDiffM ?? null;
  const hasNearestBankReading = nearestBankDiffM !== null;
  const stationWaterLevelMsl = nearestStation?.waterLevelMsl ?? null;
  const userElevationM = context?.elevationM ?? null;
  const surfaceWaterCm =
    stationWaterLevelMsl !== null && userElevationM !== null
      ? Math.round((stationWaterLevelMsl - userElevationM) * 100)
      : null;
  const surfaceSource = surfaceWaterCm !== null ? "msl_minus_elevation" : "unavailable";

  // MSL/SRTM comparison is supporting context only. SRTM is coarse, includes
  // buildings/trees, and ignores levees, drains, and gates — so it must never
  // decide whether the user's street or home is flooded.
  if (surfaceWaterCm !== null) {
    basis.push(
      `ข้อมูลประกอบ: ผิวน้ำที่สถานี ${stationWaterLevelMsl?.toFixed(2)} ม.รทก. เทียบพื้นโดยประมาณ ${userElevationM?.toFixed(1)} ม.รทก. ` +
        `→ ${surfaceWaterCm >= 0 ? "สูงกว่า" : "ต่ำกว่า"}พื้นที่นี้ประมาณ ${formatMeterCm(surfaceWaterCm)}` +
        " (SRTM 30 ม. เป็นความสูงผิวรวมสิ่งปลูกสร้าง ใช้ช่วยตีความเท่านั้น ไม่ได้ใช้ตัดสินว่าท่วมหรือไม่)",
    );
  }

  const nearestOverflowCm = hasNearestBankReading ? Math.max(0, Math.round(nearestBankDiffM * 100)) : 0;
  const displayDepthCm = hasNearestBankReading ? nearestOverflowCm : BAND_MIDPOINT_CM[band];
  const displayLabel = hasNearestBankReading
    ? nearestBankDiffM >= 0
      ? `สูงกว่าตลิ่ง ${Math.round(nearestBankDiffM * 100)} ซม.`
      : `ต่ำกว่าตลิ่ง ${Math.round(Math.abs(nearestBankDiffM) * 100)} ซม.`
    : `ประมาณ ${DEPTH_BAND_LABEL[band]}`;
  const displaySource = hasNearestBankReading ? "nearest_station_bank_diff" : "fallback_estimate";

  // Local street-level signal: station overflow + areal rain, never the DEM verdict.
  const stationCritical = stations.some((station) => station.status === "critical");
  const stationWarning = stations.some(
    (station) => station.status === "warning" || station.status === "critical",
  );
  let localSignal: LocalFloodSignal = "none";
  let localSignalLabel = "ยังไม่พบสัญญาณน้ำถึงพื้นถนน";
  if (stationCritical || maxRain > 90 || (nearestOverflowCm > 0 && maxRain >= 35.1)) {
    localSignal = "severe_watch";
    localSignalLabel = "พื้นที่ต่ำอาจมีน้ำท่วม ควรหลีกเลี่ยงเส้นทางต่ำ";
  } else if (stationWarning || maxRain >= 35.1 || nearestOverflowCm > 0) {
    localSignal = "road_flood_possible";
    localSignalLabel = "เสี่ยงน้ำขังหรือน้ำท่วมในพื้นที่ต่ำ";
  } else if (maxRain >= 10 || stations.some((station) => station.status === "watch")) {
    localSignal = "ponding_possible";
    localSignalLabel = "อาจมีน้ำขังเป็นจุดหากฝนตกต่อเนื่อง";
  }

  return {
    depthCm: BAND_MIDPOINT_CM[band],
    band,
    bandLabel: DEPTH_BAND_LABEL[band],
    driverName: driverStation?.name ?? null,
    driverBankDiffM: nearestBankDiffM,
    stationWaterLevelMsl,
    userElevationM,
    surfaceWaterCm,
    surfaceSource,
    localSignal,
    localSignalLabel,
    displayDepthCm,
    displayLabel,
    displaySource,
    basis,
    confidence: agreeingSignals >= 2 ? "medium" : "low",
  };
}
