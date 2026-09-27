import { NextResponse } from "next/server";

import { geocodeThailand } from "@/server/services/geocoding-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    return NextResponse.json(await geocodeThailand(query));
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "GEOCODING_FAILED",
          message: "ค้นหาสถานที่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 502 },
    );
  }
}
