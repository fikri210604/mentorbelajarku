import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { uploadAttendancePhoto } from "@/lib/storage";
import { validateImageDataUrl } from "@/lib/utils/image-validation";
import type { AttendanceStatus } from "@/types/database.types";

export class AttendanceService {
  /**
   * Menyimpan presensi satu murid untuk satu sesi dengan validasi server:
   * - Sesi harus ada; bila `tutorId` diberikan, sesi wajib milik tutor tsb (anti-IDOR).
   * - Murid wajib merupakan peserta sah sesi (schedule_students).
   * - Foto wajib ada dan divalidasi magic bytes.
   * - `enrollment_id` diambil dari relasi peserta, bukan dari client.
   */
  static async processAttendanceSubmission(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    photoBase64?: string | null,
    material?: string | null,
    notes?: string | null,
    userId?: string,
    tutorId?: string | null
  ) {
    const supabase = createServerClient();

    // 1. Ambil sesi
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, tutor_id, schedule_id, session_date, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      throw new Error("Sesi pembelajaran tidak ditemukan.");
    }

    // 2. Otorisasi kepemilikan sesi
    if (tutorId && session.tutor_id !== tutorId) {
      throw new Error("FORBIDDEN: Anda bukan tutor yang ditugaskan pada sesi ini.");
    }

    // 3 & 3b. Validasi keanggotaan (+ resolve enrollment) dan kunci verifikasi
    // Mengutamakan snapshot session_students (Point 3) dengan fallback legacy schedule_students.
    const [snapshotResult, legacyResult, existingResult] = await Promise.all([
      supabase
        .from("session_students")
        .select("enrollment_id")
        .eq("session_id", sessionId)
        .eq("student_id", studentId)
        .maybeSingle(),
      session.schedule_id
        ? supabase
            .from("schedule_students")
            .select("enrollment_id")
            .eq("schedule_id", session.schedule_id)
            .eq("student_id", studentId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("attendance")
        .select("id, verification_status, status, photo_path")
        .eq("session_id", sessionId)
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

    const enrollmentId: string | null =
      snapshotResult.data?.enrollment_id ?? legacyResult.data?.enrollment_id ?? null;

    if (session.schedule_id && !snapshotResult.data && !legacyResult.data) {
      throw new Error("Murid tidak terdaftar sebagai peserta pada sesi ini.");
    }

    const existingRow = existingResult.data;
    if (existingRow?.verification_status === "verified" && tutorId) {
      throw new Error(
        "FORBIDDEN: Presensi ini sudah diverifikasi Management dan tidak dapat diubah. Hubungi Management untuk koreksi."
      );
    }

    // 4. Foto wajib + validasi konten
    if (!photoBase64) {
      throw new Error("Foto bukti presensi wajib dilampirkan.");
    }
    const validated = validateImageDataUrl(photoBase64);
    if (!validated.ok) {
      throw new Error(validated.error);
    }

    const uploadResult = await uploadAttendancePhoto(
      validated.buffer,
      sessionId,
      studentId,
      validated.mimeType
    );
    if (uploadResult.error || !uploadResult.path) {
      throw new Error("Gagal mengunggah foto presensi. Silakan coba lagi.");
    }
    const photoHash = createHash("sha256").update(validated.buffer).digest("hex");

    // verification_status di-set 'submitted' saat insert baru atau saat koreksi diunggah ulang
    const nextVerificationStatus =
      !existingRow || existingRow.verification_status === "correction_requested"
        ? "submitted"
        : existingRow.verification_status;

    const { data, error } = await supabase
      .from("attendance")
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          enrollment_id: enrollmentId,
          status,
          verification_status: nextVerificationStatus,
          photo_path: uploadResult.path,
          notes: notes ?? null,
          checked_in_at: new Date().toISOString(),
          checked_in_by: userId ?? null,
          updated_by: userId ?? null,
        },
        { onConflict: "session_id,student_id" }
      )
      .select()
      .single();

    if (error) {
      throw new Error("Gagal menyimpan presensi murid.");
    }

    // 6. Learning record untuk materi
    if (material && data) {
      await supabase.from("learning_records").upsert(
        {
          attendance_id: data.id,
          tutor_id: session.tutor_id,
          student_id: studentId,
          material,
          notes: notes ?? null,
        },
        { onConflict: "attendance_id" }
      );
    }

    // 7. Audit log dengan before/after + hash foto agar pergantian bukti terdeteksi
    if (data) {
      await supabase.from("audit_logs").insert({
        user_id: userId ?? null,
        action: "ATTENDANCE_SUBMITTED",
        entity_type: "attendance",
        entity_id: data.id,
        metadata: {
          session_id: sessionId,
          student_id: studentId,
          status,
          has_photo: true,
          photo_path: uploadResult.path,
          photo_sha256: photoHash,
          before: existingRow
            ? {
                status: existingRow.status,
                photo_path: existingRow.photo_path,
                verification_status: existingRow.verification_status,
              }
            : null,
          after: {
            status,
            photo_path: uploadResult.path,
          },
        },
      });
    }

    return data;
  }
}
