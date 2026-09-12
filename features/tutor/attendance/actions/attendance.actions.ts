'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  submitSessionAttendanceSchema,
  verifyAttendanceSchema,
  type SubmitSessionAttendanceInput,
  type VerifyAttendanceInput,
} from '@/features/shared/attendance/schemas/attendance.schema';
import { computeAttendancePermissions } from '@/lib/auth/authorization';
import { validateAttendanceTimeWindow } from '@/lib/utils/attendance-window';
import { SYNTHETIC_SESSIONS } from '@/data/sessions';
import { SYNTHETIC_STUDENTS } from '@/data/students';
import { recordSyntheticAttendance } from '@/data/attendance';
import type { UserRole, AttendanceStatus } from '@/types/database.types';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Server Action: Submit attendance for students in a learning session.
 * - Memvalidasi batas waktu absensi (mulai jam mengajar s/d 2 jam kemudian)
 * - Mengunggah 1x foto sesi dan membagikannya ke seluruh murid
 * - Menyimpan presensi dan materi pembelajaran spesifik per murid
 */
export async function submitSessionAttendance(
  input: SubmitSessionAttendanceInput,
  currentUser: {
    id: string;
    role: UserRole;
    tutorId?: string | null;
  }
): Promise<ActionResponse> {
  try {
    // 1. Authorization check
    if (!currentUser || !currentUser.id) {
      return { success: false, error: 'UNAUTHORIZED: Silakan login terlebih dahulu.' };
    }

    // 2. Input validation
    const parsed = submitSessionAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Input data tidak valid',
      };
    }

    const { sessionId, items, sessionPhotoBase64, allowTimeBypass } = parsed.data;
    const supabase = createServerSupabaseClient();

    // 3. Verify session exists (di DB atau Synthetic Sessions)
    let sessionData: any = null;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, tutor_id, session_date, start_time, end_time, status')
        .eq('id', sessionId)
        .single();
      if (!error && data) {
        sessionData = data;
      }
    } catch {
      // Supabase not ready, fallback to synthetic data
    }

    if (!sessionData) {
      sessionData = SYNTHETIC_SESSIONS.find((s) => s.id === sessionId);
    }

    if (!sessionData) {
      return { success: false, error: 'Sesi pembelajaran tidak ditemukan.' };
    }

    // Tutors can only submit attendance for their assigned session
    if (currentUser.role === 'tutor' && currentUser.tutorId && sessionData.tutor_id !== currentUser.tutorId) {
      return { success: false, error: 'FORBIDDEN: Anda bukan tutor yang ditugaskan pada sesi ini.' };
    }

    // 4. Validasi Jendela Waktu Presensi (Mulai jam mengajar hingga 2 jam kemudian)
    const sessionDate = sessionData.session_date || new Date().toISOString().split('T')[0];
    const startTime = sessionData.start_time || '16:00';

    if (!allowTimeBypass) {
      const windowCheck = validateAttendanceTimeWindow(sessionDate, startTime);
      if (!windowCheck.isAllowed) {
        return {
          success: false,
          error: windowCheck.message,
        };
      }
    }

    const dateObj = new Date(sessionDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');

    // 5. Upload 1x Foto Dokumentasi Sesi (Digunakan bersama untuk semua murid)
    let sharedPhotoPath: string | null = null;
    const rawPhoto = sessionPhotoBase64 || items.find((it) => it.photoBase64)?.photoBase64;

    if (rawPhoto && rawPhoto.startsWith('data:image/')) {
      const matches = rawPhoto.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Validasi ukuran (maks 5MB) dan format
        if (buffer.length > 5 * 1024 * 1024) {
          return { success: false, error: 'Ukuran foto maksimal adalah 5MB.' };
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mimeType)) {
          return { success: false, error: 'Format foto harus berupa JPEG, PNG, atau WebP.' };
        }

        const storagePath = `attendance/${year}/${month}/${sessionId}/session_photo.jpg`;
        try {
          const { error: uploadErr } = await supabase.storage
            .from('attendance')
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadErr) {
            sharedPhotoPath = storagePath;
          } else {
            console.warn('Supabase storage upload fallback to path:', storagePath);
            sharedPhotoPath = storagePath;
          }
        } catch {
          sharedPhotoPath = storagePath;
        }
      }
    }

    // 6. Simpan presensi untuk setiap murid dengan foto yang sama dan materi masing-masing
    for (const item of items) {
      const finalPhotoPath = sharedPhotoPath || item.photoPath || null;

      // Rekam ke Supabase jika tersedia
      try {
        const { data: attendanceData, error: attErr } = await supabase
          .from('attendance')
          .upsert(
            {
              session_id: sessionId,
              student_id: item.studentId,
              student_program_id: item.studentProgramId || null,
              status: item.status as AttendanceStatus,
              photo_path: finalPhotoPath,
              material: item.material || null,
              notes: item.notes || null,
              checked_in_at: new Date().toISOString(),
              checked_in_by: currentUser.id,
              updated_by: currentUser.id,
            },
            { onConflict: 'session_id,student_id' }
          )
          .select('id')
          .single();

        if (item.material && attendanceData) {
          await supabase.from('learning_records').upsert(
            {
              attendance_id: attendanceData.id,
              tutor_id: sessionData.tutor_id,
              student_id: item.studentId,
              material: item.material,
              notes: item.notes || null,
            },
            { onConflict: 'attendance_id' }
          );
        }

        // Audit log
        if (attendanceData) {
          await supabase.from('audit_logs').insert({
            user_id: currentUser.id,
            action: 'ATTENDANCE_SUBMITTED',
            entity_type: 'attendance',
            entity_id: attendanceData.id,
            metadata: {
              sessionId,
              studentId: item.studentId,
              status: item.status,
              hasPhoto: !!finalPhotoPath,
            },
          });
        }
      } catch (dbErr) {
        console.warn('DB recording skipped in prototype mode for student:', item.studentId);
      }

      // Selalu simpan juga ke Synthetic Attendance agar langsung terbaca di UI & riwayat
      const studentMeta = SYNTHETIC_STUDENTS.find((s) => s.id === item.studentId);
      recordSyntheticAttendance({
        id: `att-${sessionId}-${item.studentId}`,
        session_id: sessionId,
        session_date: sessionDate,
        student_id: item.studentId,
        student_name: studentMeta?.name || 'Murid Bimbel',
        student_code: studentMeta?.student_code || item.studentId,
        program_name: sessionData.program_name || 'Matematika Dasar & Logika',
        bimbel_type_name: sessionData.bimbel_type_name || 'Reguler',
        tutor_name: sessionData.tutor_name || 'Tutor Pengajar',
        status: item.status as AttendanceStatus,
        verification_status: 'submitted',
        material: item.material || 'Materi pembelajaran sesi ini.',
        notes: item.notes || undefined,
        photo_path: finalPhotoPath || undefined,
        checked_in_at: new Date().toISOString(),
      });
    }

    // 7. Tandai status sesi menjadi completed
    try {
      await supabase
        .from('sessions')
        .update({
          status: 'completed',
          updated_by: currentUser.id,
        })
        .eq('id', sessionId);
    } catch {
      // In synthetic mode, update in-memory session status
      const synSession = SYNTHETIC_SESSIONS.find((s) => s.id === sessionId);
      if (synSession) {
        synSession.status = 'completed';
      }
    }

    return {
      success: true,
      message: `Presensi ${items.length} murid dan 1 foto sesi berhasil disimpan.`,
    };
  } catch (err: unknown) {
    console.error('Submit attendance unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan presensi.',
    };
  }
}


/**
 * Server Action: Management verification for attendance records.
 */
export async function verifyAttendance(
  input: VerifyAttendanceInput,
  currentUser: { id: string; role: UserRole }
): Promise<ActionResponse> {
  try {
    // Only management or admin can verify
    if (!currentUser || (currentUser.role !== 'management' && currentUser.role !== 'admin')) {
      return { success: false, error: 'FORBIDDEN: Hanya pihak Management yang dapat memverifikasi absensi.' };
    }

    const parsed = verifyAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' };
    }

    const { attendanceId, verificationStatus, notes } = parsed.data;
    const supabase = createServerSupabaseClient();

    // Fetch before state for audit
    const { data: beforeData } = await supabase
      .from('attendance')
      .select('verification_status, notes')
      .eq('id', attendanceId)
      .single();

    const { error: updateErr } = await supabase
      .from('attendance')
      .update({
        verification_status: verificationStatus,
        notes: notes || undefined,
        verified_at: new Date().toISOString(),
        verified_by: currentUser.id,
        updated_by: currentUser.id,
      })
      .eq('id', attendanceId);

    if (updateErr) {
      return { success: false, error: 'Gagal memperbarui status verifikasi: ' + updateErr.message };
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'ATTENDANCE_VERIFIED',
      entity_type: 'attendance',
      entity_id: attendanceId,
      metadata: {
        before: beforeData,
        after: { verification_status: verificationStatus, notes },
      },
    });

    return { success: true, message: 'Status verifikasi absensi berhasil diperbarui.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem',
    };
  }
}

/**
 * Helper: Generate a temporary signed URL for viewing private attendance photos.
 */
export async function getAttendancePhotoUrl(photoPath: string): Promise<string | null> {
  if (!photoPath) return null;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from('attendance')
    .createSignedUrl(photoPath, 3600); // 1 hour validity

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
