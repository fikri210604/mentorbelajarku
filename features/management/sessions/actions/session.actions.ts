"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  SessionGeneratorService,
  type GenerateSessionsInput,
} from "@/features/shared/sessions/services/session-generator.service";
import { createSuccessResult, createErrorResult } from "@/lib/traits/response.trait";

/**
 * Server Action: Generate sesi pembelajaran aktual dari jadwal rutin aktif.
 * Memeriksa authorization (role: management atau admin).
 */
export async function generateSessionsAction(options: GenerateSessionsInput = {}) {
  try {
    const session = await getAuthUser();
    if (!session || !["management", "admin", "tutor"].includes(session.role)) {
      return createErrorResult("Akses ditolak. Silakan login terlebih dahulu.", "FORBIDDEN");
    }

    // Tutor hanya diizinkan memicu generasi untuk sesi hari ini (khusus jadwal tutor sendiri)
    if (session.role === "tutor") {
      // Tanggal "hari ini" memakai WIB agar konsisten dengan filter halaman presensi.
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      options = { targetDate: todayStr, tutorId: session.tutorId || undefined };
    }

    const result = await SessionGeneratorService.generateSessions({
      ...options,
      userId: session.user.id,
    });

    if (!result.success && result.errors.length > 0 && result.createdCount === 0) {
      return createErrorResult(result.errors.join(", "), "GENERATION_FAILED");
    }

    // Revalidasi rute-rute terkait
    revalidatePath("/management/sessions");
    if (session.role === "tutor") {
      revalidatePath("/tutor/attendance");
    }

    return createSuccessResult(result, `Berhasil membuat ${result.createdCount} sesi baru (${result.skippedCount} dilewati/sudah ada).`);
  } catch (err: any) {
    return createErrorResult(err.message || "Gagal memproses pembuatan sesi", "SERVER_ERROR");
  }
}

/**
 * Server Action: Update status sesi dengan server-side authorization check & audit log.
 * Mengatasi Gap 6 sesuai AGENTS.md Rule 3.
 */
export async function updateSessionStatus(
  id: string,
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
) {
  try {
    const session = await getAuthUser();
    if (!session || !session.user.id) {
      return createErrorResult("Silakan login terlebih dahulu.", "UNAUTHORIZED");
    }

    const supabase = createServerSupabaseClient();

    // 1. Ambil data sesi eksisting untuk verifikasi kepemilikan dan audit log
    const { data: existingSession, error: fetchErr } = await supabase
      .from("sessions")
      .select("id, status, tutor_id, session_date")
      .eq("id", id)
      .single();

    if (fetchErr || !existingSession) {
      return createErrorResult("Sesi tidak ditemukan.", "NOT_FOUND");
    }

    // 2. Authorization check: Manajemen/admin boleh semua, tutor hanya boleh untuk sesinya sendiri
    const isManagement = ["management", "admin"].includes(session.role);
    const isAssignedTutor = session.tutorId && existingSession.tutor_id === session.tutorId;

    if (!isManagement && !isAssignedTutor) {
      return createErrorResult("Anda tidak memiliki izin untuk mengubah status sesi ini.", "FORBIDDEN");
    }

    // 3. Mutasi update status
    const { data, error } = await supabase
      .from("sessions")
      .update({
        status,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return createErrorResult(error.message, "DATABASE_ERROR");
    }

    // 4. Audit log perubahan status sesi (AGENTS.md Rule 16)
    try {
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "SESSION_STATUS_UPDATED",
        entity_type: "sessions",
        entity_id: id,
        metadata: {
          previous_status: existingSession.status,
          new_status: status,
          session_date: existingSession.session_date,
        },
      });
    } catch (auditErr) {
      console.warn("Gagal merekam audit log status session:", auditErr);
    }

    revalidatePath("/management/sessions");
    revalidatePath(`/management/sessions/${id}`);
    if (session.role === "tutor") {
      revalidatePath("/tutor/attendance");
    }

    return createSuccessResult(data, `Status sesi berhasil diubah menjadi ${status}.`);
  } catch (err: any) {
    return createErrorResult(err.message || "Gagal mengubah status sesi.", "SERVER_ERROR");
  }
}

export interface RescheduleSessionInput {
  originalSessionId: string;
  newDate: string;      // YYYY-MM-DD
  newStartTime: string; // HH:mm:ss or HH:mm
  newEndTime: string;   // HH:mm:ss or HH:mm
  newTutorId?: string;  // defaults to original tutor
  reason?: string;
}

/**
 * Server Action: Reschedule sesi pembelajaran dengan menjaga histori sesi asli.
 * Sesuai AGENTS.md Rule 10 (Permission & Rescheduling).
 */
export async function rescheduleSessionAction(input: RescheduleSessionInput) {
  try {
    const session = await getAuthUser();
    if (!session || !["management", "admin", "tutor"].includes(session.role)) {
      return createErrorResult("Akses ditolak. Silakan login terlebih dahulu.", "FORBIDDEN");
    }

    const supabase = createServerSupabaseClient();

    // 1. Ambil data sesi asli
    const { data: originalSession, error: origErr } = await supabase
      .from("sessions")
      .select("id, schedule_id, tutor_id, program_id, bimbel_type_id, session_date, start_time, end_time, status")
      .eq("id", input.originalSessionId)
      .single();

    if (origErr || !originalSession) {
      return createErrorResult("Sesi asli tidak ditemukan.", "NOT_FOUND");
    }

    // Tutor hanya boleh reschedule sesinya sendiri
    if (session.role === "tutor" && session.tutorId && originalSession.tutor_id !== session.tutorId) {
      return createErrorResult("Anda hanya dapat menjadwalkan ulang sesi mengajar Anda sendiri.", "FORBIDDEN");
    }

    // 2. Tandai sesi asli sebagai 'rescheduled' (AGENTS.md Rule 10: pertahankan histori)
    const { error: updateOrigErr } = await supabase
      .from("sessions")
      .update({
        status: "rescheduled",
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalSession.id);

    if (updateOrigErr) {
      return createErrorResult(`Gagal memperbarui status sesi asal: ${updateOrigErr.message}`, "DATABASE_ERROR");
    }

    // 3. Buat sesi pengganti baru dengan relasi rescheduled_from_session_id
    const effectiveTutorId = input.newTutorId || originalSession.tutor_id;
    const { data: newSession, error: createErr } = await supabase
      .from("sessions")
      .insert({
        schedule_id: originalSession.schedule_id,
        tutor_id: effectiveTutorId,
        program_id: originalSession.program_id,
        bimbel_type_id: originalSession.bimbel_type_id,
        session_date: input.newDate,
        start_time: input.newStartTime,
        end_time: input.newEndTime,
        status: "scheduled",
        rescheduled_from_session_id: originalSession.id,
        notes: input.reason || `Sesi penjadwalan ulang dari pertemuan ${originalSession.session_date}`,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (createErr || !newSession) {
      return createErrorResult(`Gagal membuat sesi baru: ${createErr?.message}`, "DATABASE_ERROR");
    }

    // 4. Catat ke audit_logs (AGENTS.md Rule 16)
    try {
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "SESSION_RESCHEDULED",
        entity_type: "sessions",
        entity_id: newSession.id,
        metadata: {
          original_session_id: originalSession.id,
          original_session_date: originalSession.session_date,
          new_session_id: newSession.id,
          new_session_date: input.newDate,
          reason: input.reason || null,
        },
      });
    } catch (auditErr) {
      console.warn("Gagal merekam audit log reschedule:", auditErr);
    }

    revalidatePath("/management/sessions");
    revalidatePath(`/management/sessions/${originalSession.id}`);
    if (session.role === "tutor") {
      revalidatePath("/tutor/attendance");
    }

    return createSuccessResult(
      newSession,
      `Sesi berhasil dijadwalkan ulang ke tanggal ${input.newDate}.`
    );
  } catch (err: any) {
    return createErrorResult(err.message || "Gagal melakukan reschedule.", "SERVER_ERROR");
  }
}

