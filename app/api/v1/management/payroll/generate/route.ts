import { NextRequest, NextResponse } from "next/server";
import { generatePayrollAction } from "@/features/management/payroll/actions/payroll.actions";
import { getAuthUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await generatePayrollAction(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
