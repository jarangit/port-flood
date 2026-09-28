import {
  fetchRainfall24h,
  fetchWaterLevels,
  type ThaiWaterLevelRow,
  type ThaiWaterRainRow,
} from "@/server/external/thaiwater/client";
import {
  mapNearbyRainfall,
  mapNearbyWaterLevels,
  type NearbyRainStation,
  type NearbyWaterStation,
} from "@/server/external/thaiwater/mapper";

export type RealtimeNearbyResponse = {
  location: { lat: number; lng: number };
  summaryStatus: "normal" | "watch" | "warning" | "critical";
  sourceStatus: "live" | "fallback";
  searchRadiusKm: number;
  stations: NearbyWaterStation[];
  rainfall: NearbyRainStation[];
  dams: never[];
  updatedAt: string;
};

const severityRank = { normal: 0, watch: 1, warning: 2, critical: 3 } as const;

export type RealtimeSummary = Pick<
  RealtimeNearbyResponse,
  "summaryStatus" | "searchRadiusKm" | "stations" | "rainfall"
>;

/** Pure mapping over prefetched ThaiWater rows so route analysis can fetch once and reuse per sample. */
export function summarizeRealtimeNearby(
  waterLevels: ThaiWaterLevelRow[],
  rainfall: ThaiWaterRainRow[],
  lat: number,
  lng: number,
  radiusKm = 25,
): RealtimeSummary {
  const safeRadius = Math.min(Math.max(radiusKm, 5), 100);

  const radiusSteps = [...new Set([safeRadius, 50, 100].filter((radius) => radius >= safeRadius))];
  let stations: NearbyWaterStation[] = [];
  let searchRadiusKm = safeRadius;

  for (const radius of radiusSteps) {
    stations = mapNearbyWaterLevels(waterLevels, lat, lng, radius, 5);
    searchRadiusKm = radius;
    if (stations.length > 0) break;
  }

  const rainfallStations = mapNearbyRainfall(
    rainfall,
    lat,
    lng,
    Math.min(safeRadius, 15),
    5,
  );

  const worst = [...stations, ...rainfallStations].reduce(
    (max, item) => (severityRank[item.status] > severityRank[max] ? item.status : max),
    "normal" as RealtimeNearbyResponse["summaryStatus"],
  );

  return {
    summaryStatus: stations.length || rainfallStations.length ? worst : "normal",
    searchRadiusKm,
    stations,
    rainfall: rainfallStations,
  };
}

export async function getRealtimeNearby(
  lat: number,
  lng: number,
  radiusKm = 25,
): Promise<RealtimeNearbyResponse> {
  try {
    const [waterLevels, rainfall] = await Promise.all([fetchWaterLevels(), fetchRainfall24h()]);
    const summary = summarizeRealtimeNearby(waterLevels, rainfall, lat, lng, radiusKm);

    return {
      location: { lat, lng },
      ...summary,
      sourceStatus: "live",
      dams: [],
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      location: { lat, lng },
      summaryStatus: "normal",
      sourceStatus: "fallback",
      searchRadiusKm: radiusKm,
      stations: [],
      rainfall: [],
      dams: [],
      updatedAt: new Date().toISOString(),
    };
  }
}
