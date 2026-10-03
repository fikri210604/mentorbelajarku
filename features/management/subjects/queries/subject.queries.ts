import { cache } from 'react';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Subject, CurriculumTopic } from '@/types/subjects';

export const getSubjects = cache(async (): Promise<Subject[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('id, code, name, level, description, status, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('getSubjects error:', error.message);
    return [];
  }
  return (data || []) as unknown as Subject[];
});

export const getSubjectById = cache(async (id: string): Promise<Subject | null> => {
  const all = await getSubjects();
  return all.find((s) => s.id === id || s.code === id) || null;
});

interface CurriculumTopicRow {
  id: string;
  subject_id: string;
  subjects?: { name?: string } | null;
  grade: string;
  chapter_number: number;
  title: string;
  description: string | null;
  worksheet_name: string | null;
  worksheet_url: string | null;
  created_at: string;
}

export const getCurriculumTopics = cache(
  async (subjectId?: string, grade?: string): Promise<CurriculumTopic[]> => {
    if (!isSupabaseConfigured()) return [];

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('curriculum_topics')
      .select(
        `id, subject_id, grade, chapter_number, title, description, worksheet_name, worksheet_url, created_at, subjects (id, name, code)`
      );

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (grade) query = query.eq('grade', grade);

    const { data, error } = await query.order('chapter_number', { ascending: true });

    if (error) {
      console.error('getCurriculumTopics error:', error.message);
      return [];
    }

    return ((data || []) as unknown as CurriculumTopicRow[]).map((item) => ({
      id: item.id,
      subject_id: item.subject_id,
      subject_name: item.subjects?.name || '',
      grade: item.grade,
      chapter_number: item.chapter_number,
      title: item.title,
      description: item.description,
      worksheet_name: item.worksheet_name,
      worksheet_url: item.worksheet_url,
      created_at: item.created_at,
    }));
  }
);
