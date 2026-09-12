import { NextResponse } from "next/server";
import { getAttendanceReportData } from "@/features/management/reports/queries/report.queries";

export async function GET() {
  const data = await getAttendanceReportData();
  return NextResponse.json({ success: true, data });
}
