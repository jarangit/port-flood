import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "flood-check-thailand", checkedAt: new Date().toISOString() });
}
