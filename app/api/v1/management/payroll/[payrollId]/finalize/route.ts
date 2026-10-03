import { NextRequest, NextResponse } from "next/server";
import { finalizePayrollAction } from "@/features/management/payroll/actions/payroll.actions";
import { requirePermissionApi } from "@/lib/auth/guards";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const guard = await requirePermissionApi("payroll:finalize");
  if (!guard.ok) return guard.response;

  const { payrollId } = await params;
  const result = await finalizePayrollAction(payrollId);
  return NextResponse.json(result);
}
