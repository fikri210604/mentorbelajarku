import { NextRequest, NextResponse } from "next/server";
import { getScheduleById } from "@/features/management/schedules/queries/schedule.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) {
    return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: schedule });
}
