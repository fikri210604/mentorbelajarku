import { NextRequest, NextResponse } from "next/server";
import { getTutorPayrolls } from "@/features/management/payroll/queries/payroll.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const { tutorId } = await params;
  const payrolls = await getTutorPayrolls(tutorId);
  return NextResponse.json({ success: true, data: payrolls });
}
