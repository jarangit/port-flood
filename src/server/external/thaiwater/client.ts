// ThaiWater v3 public API (National Hydroinformatics Data Center).
// No API key required for /public/* endpoints.
// Docs: https://standard.thaiwater.net/glossary/api-documentation/

const THAIWATER_BASE_URL =
  process.env.THAIWATER_BASE_URL ?? "https://api-v3.thaiwater.net/api/v1/thaiwater30";

const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { fetchedAt: number; data: unknown }>();

async function fetchThaiWater<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const response = await fetch(`${THAIWATER_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ThaiWater request ${path} failed with ${response.status}`);
  }

  const data = (await response.json()) as T;
  cache.set(path, { fetchedAt: Date.now(), data });
  return data;
}

export type ThaiWaterName = { th?: string; en?: string };

export type ThaiWaterLevelRow = {
  id: number;
  station: {
    id: number;
    tele_station_name?: ThaiWaterName;
    tele_station_lat?: number | null;
    tele_station_long?: number | null;
    tele_station_oldcode?: string;
    min_bank?: number | null;
    ground_level?: number | null;
  };
  basin?: { basin_code?: number };
  geocode?: {
    province_code?: string;
    province_name?: ThaiWaterName;
    amphoe_name?: ThaiWaterName;
  };
  agency?: { agency_shortname?: ThaiWaterName };
  river_name?: string | null;
  waterlevel_datetime?: string;
  waterlevel_m?: number | null;
  waterlevel_msl?: string | number | null;
  waterlevel_msl_previous?: string | number | null;
  discharge?: number | null;
  situation_level?: number | null;
  diff_wl_bank?: string | number | null;
  diff_wl_bank_text?: string | null;
};

export type ThaiWaterRainRow = {
  rain_24h?: number | null;
  rain_1h?: number | null;
  rainfall_datetime?: string;
  station?: {
    id: number;
    tele_station_name?: ThaiWaterName;
    tele_station_lat?: number | null;
    tele_station_long?: number | null;
    tele_station_oldcode?: string;
  };
  geocode?: {
    province_code?: string;
    province_name?: ThaiWaterName;
    amphoe_name?: ThaiWaterName;
  };
};

export async function fetchWaterLevels(): Promise<ThaiWaterLevelRow[]> {
  const data = await fetchThaiWater<{ waterlevel_data?: { data?: ThaiWaterLevelRow[] } }>(
    "/public/waterlevel_load",
  );
  return data.waterlevel_data?.data ?? [];
}

export async function fetchRainfall24h(): Promise<ThaiWaterRainRow[]> {
  const data = await fetchThaiWater<{ data?: ThaiWaterRainRow[] }>("/public/rain_24h");
  return data.data ?? [];
}
