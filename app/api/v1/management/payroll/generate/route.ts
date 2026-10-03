import { NextRequest, NextResponse } from "next/server";
import { generatePayrollAction } from "@/features/management/payroll/actions/payroll.actions";
import { requirePermissionApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function POST(req: NextRequest) {
  const guard = await requirePermissionApi("payroll:generate");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const result = await generatePayrollAction(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal membuat payroll.") },
      { status: 400 }
    );
  }
}
