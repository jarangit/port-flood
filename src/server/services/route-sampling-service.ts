import type { RouteSamplePoint } from "@/server/services/route-risk-types";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function interpolate(from: [number, number], to: [number, number], ratio: number): [number, number] {
  return [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
}

export function sampleRoute({
  coordinates,
  distanceKm,
  durationMin,
  maxSamples = 12,
}: {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  maxSamples?: number;
}): RouteSamplePoint[] {
  if (coordinates.length === 0) return [];

  const targetCount = Math.max(2, Math.min(maxSamples, Math.ceil(distanceKm / (distanceKm <= 20 ? 2 : 8)) + 1));
  const targetDistances = Array.from({ length: targetCount }, (_, index) =>
    (distanceKm * index) / (targetCount - 1),
  );
  const samples: RouteSamplePoint[] = [];

  let segmentStart = coordinates[0];
  let walkedKm = 0;
  let targetIndex = 0;

  for (let index = 1; index < coordinates.length && targetIndex < targetDistances.length; index += 1) {
    const segmentEnd = coordinates[index];
    const segmentKm = haversineKm(segmentStart[1], segmentStart[0], segmentEnd[1], segmentEnd[0]);

    while (targetIndex < targetDistances.length && targetDistances[targetIndex] <= walkedKm + segmentKm) {
      const targetKm = targetDistances[targetIndex];
      const ratio = segmentKm === 0 ? 0 : (targetKm - walkedKm) / segmentKm;
      const [lng, lat] = interpolate(segmentStart, segmentEnd, ratio);
      samples.push({
        lat,
        lng,
        distanceKm: Math.round(targetKm * 10) / 10,
        timeMin: Math.round((targetKm / Math.max(distanceKm, 0.1)) * durationMin),
      });
      targetIndex += 1;
    }

    walkedKm += segmentKm;
    segmentStart = segmentEnd;
  }

  const [lastLng, lastLat] = coordinates[coordinates.length - 1];
  if (samples.at(-1)?.distanceKm !== Math.round(distanceKm * 10) / 10) {
    samples.push({ lat: lastLat, lng: lastLng, distanceKm, timeMin: durationMin });
  }

  return samples;
}
