import type { TravelMode } from "@/server/services/route-risk-types";

const OPENROUTESERVICE_BASE_URL =
  process.env.OPENROUTESERVICE_BASE_URL ?? "https://api.openrouteservice.org";

export type DirectionsRoute = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

type OpenRouteServiceResponse = {
  routes?: {
    geometry?: string;
    summary?: {
      distance?: number;
      duration?: number;
    };
  }[];
  error?: { message?: string };
};

function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

function profileForMode(mode: TravelMode) {
  // ORS free routing has no reliable Thailand motorcycle profile, so motorcycle
  // intentionally follows car routing and is explained in the response disclaimer.
  return mode === "motorcycle" ? "driving-car" : "driving-car";
}

export async function fetchDirections({
  origin,
  destination,
  mode,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: TravelMode;
}): Promise<DirectionsRoute> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTESERVICE_API_KEY is not configured");
  }

  const profile = profileForMode(mode);
  const response = await fetch(`${OPENROUTESERVICE_BASE_URL}/v2/directions/${profile}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
      preference: "recommended",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  const data = (await response.json()) as OpenRouteServiceResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouteService request failed with ${response.status}`);
  }

  const route = data.routes?.[0];
  const coordinates = route?.geometry ? decodePolyline(route.geometry) : [];
  const distanceM = route?.summary?.distance;
  const durationS = route?.summary?.duration;

  if (!coordinates.length || distanceM === undefined || durationS === undefined) {
    throw new Error("OpenRouteService returned an incomplete route");
  }

  return {
    coordinates,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10,
    durationMin: Math.max(1, Math.round(durationS / 60)),
  };
}
