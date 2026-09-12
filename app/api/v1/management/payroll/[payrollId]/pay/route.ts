import { NextRequest, NextResponse } from "next/server";
import { markPayrollAsPaidAction } from "@/features/management/payroll/actions/payroll.actions";
import { getAuthUser } from "@/lib/auth/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { payrollId } = await params;
  const result = await markPayrollAsPaidAction(payrollId);
  return NextResponse.json(result);
}
