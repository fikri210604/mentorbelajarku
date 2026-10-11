import { NextResponse } from "next/server";
import { getAttendanceReportData } from "@/features/management/reports/queries/report.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requireManagementApi("attendance:read");
  if (!guard.ok) return guard.response;

  const data = await getAttendanceReportData();
  return NextResponse.json({ success: true, data });
}
