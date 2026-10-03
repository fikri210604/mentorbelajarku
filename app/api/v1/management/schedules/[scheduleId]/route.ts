import { NextRequest, NextResponse } from "next/server";
import { getScheduleById } from "@/features/management/schedules/queries/schedule.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const guard = await requireManagementApi("schedule:read");
  if (!guard.ok) return guard.response;

  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) {
    return NextResponse.json({ success: false, error: "Jadwal tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: schedule });
}
