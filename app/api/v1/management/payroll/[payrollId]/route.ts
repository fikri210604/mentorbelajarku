import { NextRequest, NextResponse } from "next/server";
import { getPayrollById } from "@/features/management/payroll/queries/payroll.queries";
import { requirePermissionApi } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const guard = await requirePermissionApi("payroll:read");
  if (!guard.ok) return guard.response;

  const { payrollId } = await params;
  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    return NextResponse.json({ success: false, error: "Payroll not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: payroll });
}
