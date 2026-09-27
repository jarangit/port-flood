import { NextResponse } from "next/server";

import { parseCoordinate } from "@/lib/validation";
import { getOfficialAlerts } from "@/server/services/alert-service";
import { getFloodRisk } from "@/server/services/flood-risk-service";
import { reverseGeocodeThailand } from "@/server/services/geocoding-service";
import { getRealtimeNearby } from "@/server/services/realtime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), 13.7563);
  const lng = parseCoordinate(searchParams.get("lng"), 100.5018);

  const reverseResult = await reverseGeocodeThailand(lat, lng);

  if ("error" in reverseResult) {
    return NextResponse.json(reverseResult, { status: 400 });
  }

  const officialAlerts = await getOfficialAlerts();
  const realtime = await getRealtimeNearby(lat, lng);

  return NextResponse.json(
    await getFloodRisk(lat, lng, reverseResult.location, officialAlerts, {
      stations: realtime.stations,
      rainfall: realtime.rainfall,
      summaryStatus: realtime.summaryStatus,
    }),
  );
}
