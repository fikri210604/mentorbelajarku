import { NextRequest, NextResponse } from "next/server";
import { getTutorSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const guard = await requireManagementApi("schedule:read");
  if (!guard.ok) return guard.response;

  const { tutorId } = await params;
  const schedules = await getTutorSchedules(tutorId);
  return NextResponse.json({ success: true, data: schedules });
}
