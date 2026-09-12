import { NextRequest, NextResponse } from "next/server";
import { getStudentHistory } from "@/features/management/students/queries/student.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const history = await getStudentHistory(studentId);
  return NextResponse.json({ success: true, data: history });
}
