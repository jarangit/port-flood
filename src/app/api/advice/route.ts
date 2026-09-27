import { NextResponse } from "next/server";

import type { RiskLevel } from "@/config/risk-levels";
import type { CurrentStatus } from "@/config/status-levels";
import { getPreparednessAdvice } from "@/server/services/advice-service";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const riskLevel = (searchParams.get("riskLevel") ?? "medium") as RiskLevel;
  const currentStatus = (searchParams.get("currentStatus") ?? "normal") as CurrentStatus;

  return NextResponse.json(getPreparednessAdvice(riskLevel, currentStatus));
}
