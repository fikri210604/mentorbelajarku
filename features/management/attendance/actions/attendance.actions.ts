'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  submitSessionAttendanceSchema,
  verifyAttendanceSchema,
  type SubmitSessionAttendanceInput,
  type VerifyAttendanceInput,
} from '@/features/shared/attendance/schemas/attendance.schema';
import { computeAttendancePermissions } from '@/lib/auth/authorization';
import type { UserRole, AttendanceStatus } from '@/types/database.types';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Server Action: Submit attendance for students in a learning session.
 * Includes server-side image validation, storage upload, and audit logging.
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

    const { sessionId, items } = parsed.data;
    const supabase = createServerSupabaseClient();

    // 3. Verify session exists and tutor identity
    const { data: sessionData, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, tutor_id, session_date, status')
      .eq('id', sessionId)
      .single();

    if (sessionErr || !sessionData) {
      return { success: false, error: 'Sesi pembelajaran tidak ditemukan.' };
    }

    // Tutors can only submit attendance for their assigned session
    if (currentUser.role === 'tutor' && currentUser.tutorId && sessionData.tutor_id !== currentUser.tutorId) {
      return { success: false, error: 'FORBIDDEN: Anda bukan tutor yang ditugaskan pada sesi ini.' };
    }

    const dateObj = new Date(sessionData.session_date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');

    // 4. Process each student attendance
    for (const item of items) {
      let finalPhotoPath = item.photoPath || null;

      // Handle base64 photo upload if present
      if (item.photoBase64 && item.photoBase64.startsWith('data:image/')) {
        const matches = item.photoBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Server-side validation: Max 5MB & valid image types
          if (buffer.length > 5 * 1024 * 1024) {
            return { success: false, error: 'Ukuran foto maksimal adalah 5MB.' };
          }
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mimeType)) {
            return { success: false, error: 'Format foto harus berupa JPEG, PNG, atau WebP.' };
          }

          const storagePath = `attendance/${year}/${month}/${sessionId}/${item.studentId}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from('attendance')
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadErr) {
            finalPhotoPath = storagePath;
          } else {
            console.error('Storage upload failed:', uploadErr);
          }
        }
      }

      // Upsert attendance record
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

      if (attErr) {
        console.error('Attendance upsert error:', attErr);
        return { success: false, error: 'Gagal menyimpan absensi murid: ' + attErr.message };
      }

      // If material is provided, record learning record
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

    // Mark session as completed
    await supabase
      .from('sessions')
      .update({
        status: 'completed',
        updated_by: currentUser.id,
      })
      .eq('id', sessionId);

    return {
      success: true,
      message: 'Absensi dan catatan sesi berhasil disimpan.',
    };
  } catch (err: unknown) {
    console.error('Submit attendance unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem',
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
