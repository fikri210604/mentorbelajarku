import { NextResponse } from "next/server";
import { getPayrolls } from "@/features/management/payroll/queries/payroll.queries";
import { requirePermissionApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requirePermissionApi("payroll:read");
  if (!guard.ok) return guard.response;

  const payrolls = await getPayrolls();
  return NextResponse.json({ success: true, data: payrolls });
}
