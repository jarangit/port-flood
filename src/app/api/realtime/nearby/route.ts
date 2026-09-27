import { NextResponse } from "next/server";

import { parseCoordinate } from "@/lib/validation";
import { getRealtimeNearby } from "@/server/services/realtime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), 13.7563);
  const lng = parseCoordinate(searchParams.get("lng"), 100.5018);
  const radiusKm = parseCoordinate(searchParams.get("radiusKm"), 25);

  return NextResponse.json(await getRealtimeNearby(lat, lng, radiusKm));
}
