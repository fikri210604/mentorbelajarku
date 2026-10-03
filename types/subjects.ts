export type EducationLevel = 'TK/PAUD' | 'SD' | 'SMP' | 'SMA' | 'Umum' | 'Semua Jenjang';

export interface Subject {
  id: string;
  code: string;
  name: string;
  level: EducationLevel;
  description?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumTopic {
  id: string;
  subject_id: string;
  subject_name?: string;
  grade: string; // e.g. '1 SD', '4 SD', '7 SMP', etc.
  chapter_number: number;
  title: string;
  description?: string | null;
  worksheet_name?: string | null;
  worksheet_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
