// GISTDA repeated-flooding polygons (2005-2016), keyless ArcGIS REST point query.
// Vintage and 1:50k scale: useful as a history signal, not house-level truth.
// Newer gateway datasets (2011-2023 recurrence, 1-day extent) need an API key
// and are documented in docs/DATA_SOURCES.md as a future upgrade.
// Portal: https://gistdaportal.gistda.or.th/data/rest/services/FL_Flood

const GISTDA_FLOOD_BASE_URL =
  process.env.GISTDA_FLOOD_BASE_URL ??
  "https://gistdaportal.gistda.or.th/data/rest/services/FL_Flood/FL_RepeatedFlooding_GISTDA_50k_Y2005_Y2016/FeatureServer/0/query";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cache = new Map<string, { fetchedAt: number; data: FloodHistoryResult }>();

export type FloodHistoryResult = {
  floodFreq: number | null;
  floodYears: number[];
  areaName: string | null;
  sourceStatus: "live" | "fallback";
};

type GistdaQueryResponse = {
  features?: {
    attributes?: Record<string, string | number | null>;
  }[];
};

const HISTORY_YEARS = Array.from({ length: 12 }, (_, i) => 2005 + i);

export async function fetchFloodHistory(
  lat: number,
  lng: number,
): Promise<FloodHistoryResult> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const store = (data: FloodHistoryResult): FloodHistoryResult => {
    cache.set(key, { fetchedAt: Date.now(), data });
    return data;
  };

  try {
    const params = new URLSearchParams({
      f: "json",
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: ["flood_freq", ...HISTORY_YEARS.map((year) => `year${year}`), "tb_tn", "ap_tn", "pv_tn"].join(","),
      returnGeometry: "false",
    });
    const response = await fetch(`${GISTDA_FLOOD_BASE_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`GISTDA query failed with ${response.status}`);
    }

    const data = (await response.json()) as GistdaQueryResponse;
    const attributes = data.features?.[0]?.attributes;
    if (!attributes) {
      return store({ floodFreq: 0, floodYears: [], areaName: null, sourceStatus: "live" });
    }

    const floodYears = HISTORY_YEARS.filter((year) => {
      const value = attributes[`year${year}`];
      return typeof value === "number" && value > 0;
    });
    const floodFreq =
      typeof attributes.flood_freq === "number" ? attributes.flood_freq : floodYears.length;
    const areaName =
      typeof attributes.tb_tn === "string" && attributes.tb_tn.trim() !== ""
        ? attributes.tb_tn
        : null;

    return store({ floodFreq, floodYears, areaName, sourceStatus: "live" });
  } catch {
    return store({ floodFreq: null, floodYears: [], areaName: null, sourceStatus: "fallback" });
  }
}
