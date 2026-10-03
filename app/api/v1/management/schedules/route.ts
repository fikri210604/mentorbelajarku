import { NextRequest, NextResponse } from "next/server";
import { getSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { createSchedule } from "@/features/management/schedules/actions/schedule.actions";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireManagementApi("schedule:read");
  if (!guard.ok) return guard.response;

  const schedules = await getSchedules();
  return NextResponse.json({ success: true, data: schedules });
}

export async function POST(req: NextRequest) {
  const guard = await requireManagementApi("schedule:create");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const result = await createSchedule(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal membuat jadwal.") },
      { status: 500 }
    );
  }
}
