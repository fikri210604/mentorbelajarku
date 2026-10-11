import { NextResponse } from "next/server";
import { getPayrollReportData } from "@/features/management/reports/queries/report.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requireManagementApi("payroll:read");
  if (!guard.ok) return guard.response;

  const data = await getPayrollReportData();
  return NextResponse.json({ success: true, data });
}
