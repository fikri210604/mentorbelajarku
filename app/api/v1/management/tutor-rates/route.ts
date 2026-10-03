import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requirePermissionApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

const createTutorRateSchema = z
  .object({
    tutorId: z.string().min(1).nullable().optional(),
    bimbelTypeId: z.string().min(1),
    level: z.string().min(1).optional(),
    ratePerStudent: z.number().nonnegative(),
    effectiveFrom: z.string().min(1),
    effectiveUntil: z.string().nullable().optional(),
  })
  .refine(
    (data) => !data.effectiveUntil || data.effectiveUntil >= data.effectiveFrom,
    { message: "Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.", path: ["effectiveUntil"] }
  );

export async function GET() {
  const guard = await requirePermissionApi("rates:manage");
  if (!guard.ok) return guard.response;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_rates")
    .select("*, tutors (*, profiles (*)), bimbel_types (*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data tarif.") },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermissionApi("rates:manage");
  if (!guard.ok) return guard.response;

  try {
    const parsed = createTutorRateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input tarif tidak valid." },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("tutor_rates")
      .insert({
        tutor_id: body.tutorId ?? null,
        bimbel_type_id: body.bimbelTypeId,
        level: body.level ?? "Semua Jenjang",
        rate_per_student: body.ratePerStudent,
        effective_from: body.effectiveFrom,
        effective_until: body.effectiveUntil ?? null,
        created_by: guard.user.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: getSafeErrorMessage(error, "Gagal menyimpan tarif tutor.") },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan tarif tutor.") },
      { status: 500 }
    );
  }
}
