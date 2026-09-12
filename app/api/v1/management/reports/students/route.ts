import { NextResponse } from "next/server";
import { getStudentReportData } from "@/features/management/reports/queries/report.queries";

export async function GET() {
  const data = await getStudentReportData();
  return NextResponse.json({ success: true, data });
}
