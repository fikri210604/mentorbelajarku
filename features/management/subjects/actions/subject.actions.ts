'use server';

import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/auth/session';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSafeErrorMessage } from '@/lib/traits/response.trait';
import {
  subjectSchema,
  SubjectInput,
  curriculumTopicSchema,
  CurriculumTopicInput,
} from '../schemas/subject.schema';

export async function saveSubjectAction(data: SubjectInput): Promise<{
  success: boolean;
  message: string;
  data?: unknown;
}> {
  try {
    const { allowed } = await checkPermission('curriculum:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya manajemen yang diizinkan mengelola mata pelajaran.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const parsed = subjectSchema.parse(data);
    const supabase = createServerSupabaseClient();

    if (parsed.id) {
      const { data: updated, error } = await supabase
        .from('subjects')
        .update({
          code: parsed.code,
          name: parsed.name,
          level: parsed.level,
          description: parsed.description || null,
          status: parsed.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsed.id)
        .select()
        .single();

      if (error || !updated) {
        return { success: false, message: 'Gagal memperbarui mata pelajaran.' };
      }
      revalidatePath('/management/settings/subjects');
      return { success: true, message: 'Mata pelajaran berhasil diperbarui.', data: updated };
    }

    const { data: created, error } = await supabase
      .from('subjects')
      .insert({
        code: parsed.code,
        name: parsed.name,
        level: parsed.level,
        description: parsed.description || null,
        status: parsed.status,
      })
      .select()
      .single();

    if (error || !created) {
      return { success: false, message: 'Gagal menambahkan mata pelajaran. Kode mungkin sudah dipakai.' };
    }
    revalidatePath('/management/settings/subjects');
    return { success: true, message: 'Mata pelajaran baru berhasil ditambahkan.', data: created };
  } catch (err: unknown) {
    console.error('saveSubjectAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menyimpan mata pelajaran.') };
  }
}

export async function deleteSubjectAction(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { allowed } = await checkPermission('curriculum:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya manajemen yang diizinkan menghapus data.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      return { success: false, message: 'Gagal menghapus mata pelajaran. Data mungkin masih dipakai.' };
    }

    revalidatePath('/management/settings/subjects');
    return { success: true, message: 'Mata pelajaran berhasil dihapus.' };
  } catch (err: unknown) {
    console.error('deleteSubjectAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menghapus mata pelajaran.') };
  }
}

export async function saveCurriculumTopicAction(data: CurriculumTopicInput): Promise<{
  success: boolean;
  message: string;
  data?: unknown;
}> {
  try {
    const { allowed } = await checkPermission('curriculum:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya manajemen yang diizinkan mengelola silabus bab.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const parsed = curriculumTopicSchema.parse(data);
    const supabase = createServerSupabaseClient();

    if (parsed.id) {
      const { data: updated, error } = await supabase
        .from('curriculum_topics')
        .update({
          subject_id: parsed.subject_id,
          grade: parsed.grade,
          chapter_number: parsed.chapter_number,
          title: parsed.title,
          description: parsed.description || null,
          worksheet_name: parsed.worksheet_name || null,
          worksheet_url: parsed.worksheet_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsed.id)
        .select()
        .single();

      if (error || !updated) {
        return { success: false, message: 'Gagal memperbarui bab materi.' };
      }
      revalidatePath('/management/settings/subjects');
      return { success: true, message: 'Bab materi berhasil diperbarui.', data: updated };
    }

    const { data: created, error } = await supabase
      .from('curriculum_topics')
      .insert({
        subject_id: parsed.subject_id,
        grade: parsed.grade,
        chapter_number: parsed.chapter_number,
        title: parsed.title,
        description: parsed.description || null,
        worksheet_name: parsed.worksheet_name || null,
        worksheet_url: parsed.worksheet_url || null,
      })
      .select()
      .single();

    if (error || !created) {
      return { success: false, message: 'Gagal menambahkan bab materi.' };
    }
    revalidatePath('/management/settings/subjects');
    return { success: true, message: 'Bab materi baru berhasil ditambahkan.', data: created };
  } catch (err: unknown) {
    console.error('saveCurriculumTopicAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menyimpan bab materi.') };
  }
}

export async function deleteCurriculumTopicAction(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { allowed } = await checkPermission('curriculum:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya manajemen yang diizinkan menghapus bab materi.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('curriculum_topics').delete().eq('id', id);
    if (error) {
      return { success: false, message: 'Gagal menghapus bab materi.' };
    }

    revalidatePath('/management/settings/subjects');
    return { success: true, message: 'Bab materi berhasil dihapus dari kurikulum.' };
  } catch (err: unknown) {
    console.error('deleteCurriculumTopicAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menghapus bab materi.') };
  }
}
