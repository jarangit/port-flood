import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ dams: [], updatedAt: new Date().toISOString() });
}
