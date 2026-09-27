// OSM Overpass API: nearest river/canal/stream to a point.
// Fair-use rules: cache aggressively, single request at a time, valid User-Agent.
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API

const OVERPASS_BASE_URL =
  process.env.OVERPASS_BASE_URL ?? "https://overpass-api.de/api/interpreter";

const USER_AGENT = process.env.OVERPASS_USER_AGENT ?? "flood-check-thailand/0.1";

const SEARCH_RADIUS_M = 2000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cache = new Map<string, { fetchedAt: number; data: WaterwayResult }>();

export type WaterwayResult = {
  distanceM: number | null;
  kind: string | null;
  sourceStatus: "live" | "fallback";
};

type OverpassResponse = {
  elements?: {
    type?: string;
    tags?: { waterway?: string; name?: string };
    center?: { lat?: number; lon?: number };
    lat?: number;
    lon?: number;
  }[];
};

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthM * Math.asin(Math.sqrt(a));
}

export async function fetchNearestWaterway(
  lat: number,
  lng: number,
): Promise<WaterwayResult> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const store = (data: WaterwayResult): WaterwayResult => {
    cache.set(key, { fetchedAt: Date.now(), data });
    return data;
  };

  try {
    const query = `[out:json][timeout:15];way(around:${SEARCH_RADIUS_M},${lat},${lng})[waterway];out tags center 20;`;
    const params = new URLSearchParams({ data: query });
    const response = await fetch(`${OVERPASS_BASE_URL}?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with ${response.status}`);
    }

    const data = (await response.json()) as OverpassResponse;
    let best: WaterwayResult = { distanceM: null, kind: null, sourceStatus: "live" };

    for (const element of data.elements ?? []) {
      const pointLat = element.center?.lat ?? element.lat;
      const pointLng = element.center?.lon ?? element.lon;
      if (pointLat === undefined || pointLng === undefined) continue;
      const distanceM = Math.round(haversineM(lat, lng, pointLat, pointLng));
      if (best.distanceM === null || distanceM < best.distanceM) {
        best = { distanceM, kind: element.tags?.waterway ?? null, sourceStatus: "live" };
      }
    }

    return store(best);
  } catch {
    return store({ distanceM: null, kind: null, sourceStatus: "fallback" });
  }
}
