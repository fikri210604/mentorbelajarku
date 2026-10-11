import { NextResponse } from "next/server";
import { getStudentReportData } from "@/features/management/reports/queries/report.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const data = await getStudentReportData();
  return NextResponse.json({ success: true, data });
}
