import { NextRequest, NextResponse } from "next/server";
import { getTutorSchedules } from "@/features/management/schedules/queries/schedule.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const { tutorId } = await params;
  const schedules = await getTutorSchedules(tutorId);
  return NextResponse.json({ success: true, data: schedules });
}
