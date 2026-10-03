import { NextResponse } from "next/server";
import { getSessions } from "@/features/management/sessions/queries/session.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requireManagementApi("session:read");
  if (!guard.ok) return guard.response;

  const sessions = await getSessions();
  return NextResponse.json({ success: true, data: sessions });
}
