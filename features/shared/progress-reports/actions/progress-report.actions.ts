"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { createSuccessResult, createErrorResult } from "@/lib/traits/response.trait";

export interface CreateProgressReportInput {
  studentId: string;
  enrollmentId?: string | null;
  tutorId?: string | null;
  periodTitle: string;
  achievement: string;
  evaluation: string;
  notes?: string | null;
}

export async function createProgressReportAction(input: CreateProgressReportInput) {
  try {
    const session = await getAuthUser();
    if (!session || !["management", "admin", "tutor"].includes(session.role)) {
      return createErrorResult("Akses ditolak. Silakan login terlebih dahulu.", "FORBIDDEN");
    }

    if (!input.studentId || !input.periodTitle || !input.achievement || !input.evaluation) {
      return createErrorResult("Semua kolom evaluasi wajib diisi.", "VALIDATION_ERROR");
    }

    const supabase = createServerSupabaseClient();
    const effectiveTutorId = input.tutorId || session.tutorId || null;

    const { data: newReport, error } = await supabase
      .from("progress_reports")
      .insert({
        student_id: input.studentId,
        enrollment_id: input.enrollmentId || null,
        tutor_id: effectiveTutorId,
        period_title: input.periodTitle,
        achievement: input.achievement,
        evaluation: input.evaluation,
        notes: input.notes || null,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error || !newReport) {
      return createErrorResult(error?.message || "Gagal menyimpan laporan evaluasi.", "DATABASE_ERROR");
    }

    // Catat ke audit_logs (AGENTS.md Rule 16)
    try {
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "PROGRESS_REPORT_CREATED",
        entity_type: "progress_reports",
        entity_id: newReport.id,
        metadata: {
          student_id: input.studentId,
          period_title: input.periodTitle,
        },
      });
    } catch (auditErr) {
      console.warn("Gagal merekam audit log progress report:", auditErr);
    }

    revalidatePath("/management/progress-reports");
    revalidatePath(`/management/students/${input.studentId}`);

    return createSuccessResult(newReport, "Laporan evaluasi murid berhasil disimpan.");
  } catch (err: any) {
    return createErrorResult(err.message || "Terjadi kesalahan sistem.", "SERVER_ERROR");
  }
}
