import { NextResponse } from "next/server";

import { getRouteRisk } from "@/server/services/route-risk-service";
import type { RouteRiskRequest } from "@/server/services/route-risk-types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RouteRiskRequest;
    return NextResponse.json(await getRouteRisk(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "วิเคราะห์เส้นทางไม่สำเร็จ";
    const status =
      message.includes("OPENROUTESERVICE_API_KEY") || message.includes("OpenRouteService")
        ? 502
        : 400;

    return NextResponse.json(
      {
        error: {
          code: status === 502 ? "ROUTING_PROVIDER_FAILED" : "ROUTE_RISK_FAILED",
          message:
            status === 502
              ? "ดึงข้อมูลเส้นทางไม่สำเร็จ กรุณาตรวจ API key หรือทดลองใหม่อีกครั้ง"
              : message,
          details: message,
        },
      },
      { status },
    );
  }
}
