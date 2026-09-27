import type {
  ThaiWaterLevelRow,
  ThaiWaterRainRow,
} from "@/server/external/thaiwater/client";

export type NearbyWaterStation = {
  id: string;
  name: string;
  agency: string;
  river?: string;
  province?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  waterLevelMsl?: number;
  trendM?: number;
  bankDiffM?: number;
  bankStatusText?: string;
  discharge?: number;
  situation: number | null;
  status: "normal" | "watch" | "warning" | "critical";
  updatedAt: string;
};

export type NearbyRainStation = {
  id: string;
  name: string;
  province?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  rain24h?: number;
  rain1h?: number;
  status: "normal" | "watch" | "warning" | "critical";
  updatedAt: string;
};

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function diffNumbers(current?: number, previous?: number): number | undefined {
  if (current === undefined || previous === undefined) return undefined;
  const diff = Math.round((current - previous) * 100) / 100;
  return Number.isFinite(diff) ? diff : undefined;
}

function thaiName(name?: { th?: string; en?: string }, fallback = "ไม่ทราบชื่อสถานี") {
  return name?.th || name?.en || fallback;
}

// ThaiWater situation_level: 1 normal, 2 watch, 3 warning, 4 critical, 5 flood/critical.
function mapSituationToStatus(
  situation: number | null | undefined,
): NearbyWaterStation["status"] {
  if (situation === 5 || situation === 4) return "critical";
  if (situation === 3) return "warning";
  if (situation === 2) return "watch";
  return "normal";
}

// Thai rainfall criteria (mm/24h): heavy 35.1-90, very heavy >90.
function mapRainToStatus(rain24h?: number): NearbyRainStation["status"] {
  if (rain24h === undefined) return "normal";
  if (rain24h > 90) return "critical";
  if (rain24h >= 35.1) return "warning";
  if (rain24h >= 10) return "watch";
  return "normal";
}

export function mapNearbyWaterLevels(
  rows: ThaiWaterLevelRow[],
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number,
): NearbyWaterStation[] {
  return rows
    .map((row): NearbyWaterStation | null => {
      const stationLat = row.station?.tele_station_lat;
      const stationLng = row.station?.tele_station_long;
      if (stationLat == null || stationLng == null) return null;
      const distanceKm = haversineKm(lat, lng, stationLat, stationLng);
      if (distanceKm > radiusKm) return null;
      return {
        id: `thw-wl-${row.station?.id ?? row.id}`,
        name: thaiName(row.station?.tele_station_name),
        agency: thaiName(row.agency?.agency_shortname, "ThaiWater"),
        river: row.river_name ?? undefined,
        province: row.geocode?.province_name?.th,
        lat: stationLat,
        lng: stationLng,
        distanceKm: Math.round(distanceKm * 10) / 10,
        waterLevelMsl: toNumber(row.waterlevel_msl),
        trendM: diffNumbers(toNumber(row.waterlevel_msl), toNumber(row.waterlevel_msl_previous)),
        bankDiffM: toNumber(row.diff_wl_bank),
        bankStatusText: row.diff_wl_bank_text ?? undefined,
        discharge: row.discharge ?? undefined,
        situation: row.situation_level ?? null,
        status: mapSituationToStatus(row.situation_level),
        updatedAt: row.waterlevel_datetime ?? new Date().toISOString(),
      };
    })
    .filter((row): row is NearbyWaterStation => row !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function mapNearbyRainfall(
  rows: ThaiWaterRainRow[],
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number,
): NearbyRainStation[] {
  return rows
    .map((row): NearbyRainStation | null => {
      const stationLat = row.station?.tele_station_lat;
      const stationLng = row.station?.tele_station_long;
      if (stationLat == null || stationLng == null) return null;
      const distanceKm = haversineKm(lat, lng, stationLat, stationLng);
      if (distanceKm > radiusKm) return null;
      const rain24h = row.rain_24h ?? undefined;
      return {
        id: `thw-rain-${row.station?.id ?? `${stationLat},${stationLng}`}`,
        name: thaiName(row.station?.tele_station_name),
        province: row.geocode?.province_name?.th,
        lat: stationLat,
        lng: stationLng,
        distanceKm: Math.round(distanceKm * 10) / 10,
        rain24h: rain24h ?? undefined,
        rain1h: row.rain_1h ?? undefined,
        status: mapRainToStatus(rain24h ?? undefined),
        updatedAt: row.rainfall_datetime ?? new Date().toISOString(),
      };
    })
    .filter((row): row is NearbyRainStation => row !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
