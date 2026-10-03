'use server';

import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { requireAuthUser } from '@/lib/auth/session';
import { getSafeErrorMessage } from '@/lib/traits/response.trait';

export interface UpdateEvaluationInput {
  attendanceId: string;
  material: string;
  notes?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Menyimpan koreksi materi/catatan evaluasi Management.
 * Materi disimpan di `learning_records` (bukan lagi di `attendance`).
 */
export async function saveEvaluationUpdatesAction(
  updates: UpdateEvaluationInput[]
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireAuthUser();
    if (!['management', 'admin'].includes(user.role)) {
      return { success: false, message: 'Hanya manajemen yang dapat mengubah catatan materi.' };
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      return { success: true, message: 'Tidak ada perubahan yang perlu disimpan.' };
    }

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();

      for (const item of updates) {
        if (!UUID_REGEX.test(item.attendanceId)) continue;

        const { data: attendance } = await supabase
          .from('attendance')
          .select('id, session_id, student_id, sessions (tutor_id)')
          .eq('id', item.attendanceId)
          .maybeSingle();

        if (!attendance) continue;

        const tutorId = (attendance as unknown as { sessions?: { tutor_id?: string } }).sessions
          ?.tutor_id;

        if (!tutorId) continue;

        await supabase.from('learning_records').upsert(
          {
            attendance_id: item.attendanceId,
            tutor_id: tutorId,
            student_id: attendance.student_id,
            material: item.material,
            notes: item.notes || null,
          },
          { onConflict: 'attendance_id' }
        );

        await supabase.from('audit_logs').insert({
          user_id: user.user.id,
          action: 'LEARNING_RECORD_CORRECTED',
          entity_type: 'attendance',
          entity_id: item.attendanceId,
          metadata: { material: item.material, notes: item.notes || null },
        });
      }
    }

    return {
      success: true,
      message: 'Perubahan materi evaluasi berhasil disimpan ke sistem.',
    };
  } catch (err: unknown) {
    console.error('saveEvaluationUpdatesAction error:', err);
    return {
      success: false,
      message: getSafeErrorMessage(err, 'Gagal menyimpan perubahan materi.'),
    };
  }
}
