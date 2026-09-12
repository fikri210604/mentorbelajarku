import { NextRequest, NextResponse } from "next/server";
import { getStudentById } from "@/features/management/students/queries/student.queries";
import { updateStudent } from "@/features/management/students/actions/student.actions";
import { getAuthUser } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: student });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await params;
  try {
    const body = await req.json();
    const result = await updateStudent(studentId, body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
