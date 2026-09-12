import { NextResponse } from "next/server";
import { getPayrollReportData } from "@/features/management/reports/queries/report.queries";

export async function GET() {
  const data = await getPayrollReportData();
  return NextResponse.json({ success: true, data });
}
