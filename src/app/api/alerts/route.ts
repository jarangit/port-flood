import { NextResponse } from "next/server";

import { getOfficialAlerts } from "@/server/services/alert-service";

export async function GET() {
  return NextResponse.json(await getOfficialAlerts());
}
