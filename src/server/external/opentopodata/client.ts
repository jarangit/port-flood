// OpenTopoData public API: free elevation data, no key required.
// Public limits: 1 request/second, 1000 calls/day, 100 locations/request.
// Elevation is static, so results are cached for 30 days keyed by rounded coords.
// Docs: https://www.opentopodata.org/

const OPENTOPODATA_BASE_URL =
  process.env.OPENTOPODATA_BASE_URL ?? "https://api.opentopodata.org/v1";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cache = new Map<string, { fetchedAt: number; data: ElevationResult }>();

export type ElevationResult = {
  elevationM: number | null;
  dataset: string;
  sourceStatus: "live" | "fallback";
};

type OpenTopoDataResponse = {
  results?: { elevation?: number | null }[];
};

export async function fetchElevation(lat: number, lng: number): Promise<ElevationResult> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const store = (data: ElevationResult): ElevationResult => {
    cache.set(key, { fetchedAt: Date.now(), data });
    return data;
  };

  try {
    const response = await fetch(
      `${OPENTOPODATA_BASE_URL}/srtm30m?locations=${lat},${lng}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenTopoData request failed with ${response.status}`);
    }

    const data = (await response.json()) as OpenTopoDataResponse;
    const elevation = data.results?.[0]?.elevation ?? null;

    return store({
      elevationM: elevation,
      dataset: "srtm30m",
      sourceStatus: elevation === null ? "fallback" : "live",
    });
  } catch {
    return store({ elevationM: null, dataset: "srtm30m", sourceStatus: "fallback" });
  }
}
