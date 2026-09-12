import { NextResponse } from "next/server";
import { getPayrolls } from "@/features/management/payroll/queries/payroll.queries";

export async function GET() {
  const payrolls = await getPayrolls();
  return NextResponse.json({ success: true, data: payrolls });
}
