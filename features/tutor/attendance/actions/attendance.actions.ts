'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  submitSessionAttendanceSchema,
  verifyAttendanceSchema,
  overrideAttendanceWindowSchema,
  type SubmitSessionAttendanceInput,
  type VerifyAttendanceInput,
  type OverrideAttendanceWindowInput,
} from '@/features/shared/attendance/schemas/attendance.schema';
import { getCurrentUser, sessionHasPermission } from '@/lib/auth/session';
import { validateAttendanceTimeWindow } from '@/lib/utils/attendance-window';
import { validateImageDataUrl } from '@/lib/utils/image-validation';
import { uploadAttendancePhoto, signAttendancePhotoPath } from '@/lib/storage';
import { getSafeErrorMessage } from '@/lib/traits/response.trait';
import type { AttendanceStatus } from '@/types/database.types';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface SubmitItem {
  student_id: string;
  status: AttendanceStatus;
  material: string | null;
  notes: string | null;
}

function mapRpcError(message: string): string {
  if (message.includes('STUDENT_NOT_IN_SESSION')) {
    return 'Terdapat murid yang bukan peserta sah pada sesi ini. Presensi dibatalkan.';
  }
  if (message.includes('SESSION_NOT_FOUND')) return 'Sesi pembelajaran tidak ditemukan.';
  if (message.includes('SESSION_CANCELLED')) return 'Sesi telah dibatalkan dan tidak dapat diabsen.';
  if (message.includes('EMPTY_ITEMS')) return 'Minimal satu murid harus diabsen.';
  return 'Gagal menyimpan presensi sesi. Silakan coba lagi.';
}

/**
 * Server Action: submit presensi untuk seluruh murid dalam satu sesi.
 * Identitas pemanggil SELALU diambil dari sesi server (bukan dari parameter client).
 * Foto sesi wajib; seluruh tulisan dilakukan atomik lewat RPC PostgreSQL.
 */
export async function submitSessionAttendance(
  input: SubmitSessionAttendanceInput
): Promise<ActionResponse> {
  try {
    // 1. Autentikasi & otorisasi di server
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'UNAUTHORIZED: Silakan login terlebih dahulu.' };
    }
    if (!sessionHasPermission(currentUser, 'attendance:create')) {
      return { success: false, error: 'FORBIDDEN: Anda tidak berhak mengirim presensi.' };
    }

    // 2. Validasi input
    const parsed = submitSessionAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Input data tidak valid',
      };
    }
    const { sessionId, items, sessionPhotoBase64 } = parsed.data;

    const supabase = createServerSupabaseClient();

    // 3. Ambil sesi + konfigurasi jendela presensi
    const { data: sessionData, error: sessionErr } = await supabase
      .from('sessions')
      .select(
        'id, tutor_id, session_date, start_time, end_time, status, attendance_deadline, allow_late_upload'
      )
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionErr || !sessionData) {
      return { success: false, error: 'Sesi pembelajaran tidak ditemukan.' };
    }
    if (sessionData.status === 'cancelled') {
      return { success: false, error: 'Sesi telah dibatalkan dan tidak dapat diabsen.' };
    }

    // 4. Tutor hanya boleh mengabsen sesinya sendiri; akun tanpa tutorId fail closed.
    if (currentUser.role === 'tutor') {
      if (!currentUser.tutorId || sessionData.tutor_id !== currentUser.tutorId) {
        return { success: false, error: 'FORBIDDEN: Anda bukan tutor yang ditugaskan pada sesi ini.' };
      }
    }

    // 5. Validasi jendela waktu (murni di server, tidak dapat di-bypass dari client)
    const { data: windowSetting } = await supabase
      .from('attendance_window_settings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const windowCheck = validateAttendanceTimeWindow(
      sessionData.session_date,
      sessionData.start_time || '00:00',
      {
        openBeforeMinutes: windowSetting?.open_before_minutes ?? 15,
        closeAfterHours: windowSetting?.close_after_hours ?? 4,
        maxDaysAllowed: windowSetting?.max_days_allowed ?? 1,
        allowBackdate: windowSetting?.allow_tutor_backdate ?? false,
        sessionDeadlineOverride: sessionData.attendance_deadline,
        sessionAllowLateUpload: sessionData.allow_late_upload,
      }
    );

    if (!windowCheck.isAllowed) {
      return { success: false, error: windowCheck.message };
    }

    // 6. Foto sesi wajib + validasi konten (magic bytes), bukan sekadar MIME client
    const validatedPhoto = validateImageDataUrl(sessionPhotoBase64);
    if (!validatedPhoto.ok) {
      return { success: false, error: validatedPhoto.error };
    }

    const uploadResult = await uploadAttendancePhoto(
      validatedPhoto.buffer,
      sessionId,
      'session',
      validatedPhoto.mimeType
    );
    if (uploadResult.error || !uploadResult.path) {
      return { success: false, error: 'Gagal mengunggah foto presensi. Silakan coba lagi.' };
    }

    // 7. Susun items untuk RPC (tanpa studentProgramId/material attendance)
    const rpcItems: SubmitItem[] = items.map((item) => ({
      student_id: item.studentId,
      status: item.status as AttendanceStatus,
      material: item.material?.trim() || null,
      notes: item.notes?.trim() || null,
    }));

    const { error: rpcErr } = await (supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>;
    }).rpc('submit_session_attendance', {
      p_session_id: sessionId,
      p_actor_id: currentUser.user.id,
      p_photo_path: uploadResult.path,
      p_items: rpcItems,
    });

    if (rpcErr) {
      console.warn('submit_session_attendance RPC error:', rpcErr.message);
      return { success: false, error: mapRpcError(rpcErr.message) };
    }

    return {
      success: true,
      message: `Presensi ${items.length} murid dan foto dokumentasi berhasil disimpan.`,
    };
  } catch (err: unknown) {
    console.error('Submit attendance unexpected error:', err);
    return {
      success: false,
      error: getSafeErrorMessage(err, 'Terjadi kesalahan sistem saat menyimpan presensi.'),
    };
  }
}

/**
 * Server Action: verifikasi/koreksi presensi oleh Management.
 */
export async function verifyAttendance(input: VerifyAttendanceInput): Promise<ActionResponse> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'UNAUTHORIZED: Silakan login terlebih dahulu.' };
    }
    if (!sessionHasPermission(currentUser, 'attendance:verify')) {
      return { success: false, error: 'FORBIDDEN: Anda tidak berhak memverifikasi presensi.' };
    }

    const parsed = verifyAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' };
    }

    const { attendanceId, verificationStatus, notes } = parsed.data;
    const supabase = createServerSupabaseClient();

    const { data: beforeData } = await supabase
      .from('attendance')
      .select('verification_status, notes')
      .eq('id', attendanceId)
      .maybeSingle();

    const { error: updateErr } = await supabase
      .from('attendance')
      .update({
        verification_status: verificationStatus,
        notes: notes || undefined,
        verified_at: new Date().toISOString(),
        verified_by: currentUser.user.id,
        updated_by: currentUser.user.id,
      })
      .eq('id', attendanceId);

    if (updateErr) {
      return {
        success: false,
        error: getSafeErrorMessage(updateErr, 'Gagal memperbarui status verifikasi absensi.'),
      };
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.user.id,
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
    console.error('verifyAttendance unexpected error:', err);
    return {
      success: false,
      error: getSafeErrorMessage(err, 'Terjadi kesalahan sistem saat memverifikasi absensi.'),
    };
  }
}

/**
 * Server Action (Management): memberi izin upload di luar jendela waktu untuk
 * satu sesi. Menggantikan `allowTimeBypass` yang sebelumnya dikendalikan client.
 */
export async function overrideAttendanceWindow(
  input: OverrideAttendanceWindowInput
): Promise<ActionResponse> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'UNAUTHORIZED: Silakan login terlebih dahulu.' };
    }
    if (!sessionHasPermission(currentUser, 'attendance:update')) {
      return { success: false, error: 'FORBIDDEN: Hanya Management yang dapat memberi pengecualian.' };
    }

    const parsed = overrideAttendanceWindowSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' };
    }

    const { sessionId, reason } = parsed.data;
    const supabase = createServerSupabaseClient();

    const { error: updateErr } = await supabase
      .from('sessions')
      .update({
        allow_late_upload: true,
        late_upload_reason: reason,
        updated_by: currentUser.user.id,
      })
      .eq('id', sessionId);

    if (updateErr) {
      return {
        success: false,
        error: getSafeErrorMessage(updateErr, 'Gagal memberi pengecualian presensi.'),
      };
    }

    await supabase.from('audit_logs').insert({
      user_id: currentUser.user.id,
      action: 'ATTENDANCE_WINDOW_OVERRIDE',
      entity_type: 'sessions',
      entity_id: sessionId,
      metadata: { reason },
    });

    return { success: true, message: 'Pengecualian jendela presensi berhasil dicatat.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: getSafeErrorMessage(err, 'Terjadi kesalahan sistem.'),
    };
  }
}

/**
 * Server Action: menghasilkan signed URL untuk foto presensi SETELAH
 * memverifikasi bahwa pemanggil berhak atas attendance terkait.
 */
export async function getAuthorizedAttendancePhotoUrl(
  attendanceId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const supabase = createServerSupabaseClient();
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('photo_path, sessions!inner (tutor_id)')
      .eq('id', attendanceId)
      .maybeSingle();

    if (error || !attendance) {
      return { success: false, error: 'Presensi tidak ditemukan.' };
    }

    const ownerTutorId = (attendance as unknown as { sessions?: { tutor_id?: string } }).sessions
      ?.tutor_id;

    const isOwner = Boolean(currentUser.tutorId) && currentUser.tutorId === ownerTutorId;
    const canReadAll = sessionHasPermission(currentUser, 'attendance:read') && currentUser.role !== 'tutor';

    if (!isOwner && !canReadAll) {
      return { success: false, error: 'FORBIDDEN: Anda tidak berhak melihat foto presensi ini.' };
    }

    const photoPath = (attendance as { photo_path?: string | null }).photo_path;
    if (!photoPath) {
      return { success: false, error: 'Foto tidak tersedia.' };
    }

    const url = await signAttendancePhotoPath(photoPath);
    if (!url) {
      return { success: false, error: 'Gagal membuat tautan foto.' };
    }

    return { success: true, url };
  } catch (err: unknown) {
    return { success: false, error: getSafeErrorMessage(err, 'Gagal membuat tautan foto.') };
  }
}
