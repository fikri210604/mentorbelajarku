import { NextRequest, NextResponse } from "next/server";
import { markPayrollAsPaidAction } from "@/features/management/payroll/actions/payroll.actions";
import { requirePermissionApi } from "@/lib/auth/guards";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const guard = await requirePermissionApi("payroll:pay");
  if (!guard.ok) return guard.response;

  const { payrollId } = await params;
  const result = await markPayrollAsPaidAction(payrollId);
  return NextResponse.json(result);
}
