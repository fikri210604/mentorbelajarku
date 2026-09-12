import { NextResponse } from "next/server";
import { getSessions } from "@/features/management/sessions/queries/session.queries";

export async function GET() {
  const sessions = await getSessions();
  return NextResponse.json({ success: true, data: sessions });
}
