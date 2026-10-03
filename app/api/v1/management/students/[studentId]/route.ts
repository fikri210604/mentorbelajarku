import { NextRequest, NextResponse } from "next/server";
import { getStudentById } from "@/features/management/students/queries/student.queries";
import { updateStudent } from "@/features/management/students/actions/student.actions";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) {
    return NextResponse.json({ success: false, error: "Murid tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: student });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const guard = await requireManagementApi("student:update");
  if (!guard.ok) return guard.response;

  const { studentId } = await params;
  try {
    const body = await req.json();
    const result = await updateStudent(studentId, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal memperbarui data murid.") },
      { status: 500 }
    );
  }
}
