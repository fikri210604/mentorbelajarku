import { NextRequest, NextResponse } from "next/server";
import { getSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { createSchedule } from "@/features/management/schedules/actions/schedule.actions";
import { getAuthUser } from "@/lib/auth/session";

export async function GET() {
  const schedules = await getSchedules();
  return NextResponse.json({ success: true, data: schedules });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await createSchedule(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
