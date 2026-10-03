import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";
import { STUDENTS_CACHE_TAG } from "@/lib/cache/tags";

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  programId: z.string().min(1),
  bimbelTypeId: z.string().min(1),
  packageId: z.string().nullable().optional(),
  packageName: z.string().min(1).optional(),
  maxMeetings: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

export async function GET() {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, student_id, program_id, bimbel_type_id, package_id, package_name,
       max_meetings, price, start_date, end_date, status, created_at, updated_at,
       students (id, student_code, name),
       programs (id, code, name),
       bimbel_types (id, name, duration_minutes)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data enrollment.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireManagementApi("student:update");
  if (!guard.ok) return guard.response;

  try {
    const parsed = createEnrollmentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input enrollment tidak valid." },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: body.studentId,
        program_id: body.programId,
        bimbel_type_id: body.bimbelTypeId,
        package_id: body.packageId ?? null,
        package_name: body.packageName ?? "Paket Belajar",
        max_meetings: body.maxMeetings,
        price: body.price ?? 0,
        start_date: body.startDate,
        end_date: body.endDate ?? null,
        status: body.status ?? "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: getSafeErrorMessage(error, "Gagal membuat enrollment.") },
        { status: 400 }
      );
    }

    revalidateTag(STUDENTS_CACHE_TAG, "max");

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal membuat enrollment.") },
      { status: 500 }
    );
  }
}
