export function parseCoordinate(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isCoordinateInThailand(lat: number, lng: number) {
  return lat >= 5.4 && lat <= 20.5 && lng >= 97.3 && lng <= 105.8;
}
