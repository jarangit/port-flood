import { NextResponse } from "next/server";

import { parseCoordinate } from "@/lib/validation";
import { reverseGeocodeThailand } from "@/server/services/geocoding-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), 13.7563);
  const lng = parseCoordinate(searchParams.get("lng"), 100.5018);

  try {
    const result = await reverseGeocodeThailand(lat, lng);

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "REVERSE_GEOCODING_FAILED",
          message: "อ่านตำแหน่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 502 },
    );
  }
}
