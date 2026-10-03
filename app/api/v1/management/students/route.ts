import { NextRequest } from "next/server";
import { getStudents, getStudentsPaginated } from "@/features/management/students/queries/student.queries";
import { createStudent } from "@/features/management/students/actions/student.actions";
import { requireManagementApi } from "@/lib/auth/guards";
import { apiSuccess, apiPaginated, apiError } from "@/lib/traits/response.trait";

export async function GET(req: NextRequest) {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const hasPagination = searchParams.has("page") || searchParams.has("pageSize");

  if (hasPagination) {
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const result = await getStudentsPaginated({ page, pageSize, search, status });
    return apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.pageSize);
  }

  const students = await getStudents();
  return apiSuccess(students);
}

export async function POST(req: NextRequest) {
  const guard = await requireManagementApi("student:create");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const result = await createStudent(body);
    if (!result.success) {
      return apiError(result.error || "Gagal menambahkan murid baru", { status: 400, code: "VALIDATION_ERROR" });
    }
    return apiSuccess(result.data, { status: 201, message: result.message || "Murid berhasil ditambahkan" });
  } catch (err: unknown) {
    return apiError(
      err instanceof Error ? err.message : "Terjadi kesalahan internal",
      { status: 500, code: "INTERNAL" }
    );
  }
}
