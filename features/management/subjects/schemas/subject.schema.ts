import { z } from 'zod';

export const subjectSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .min(2, 'Kode mapel minimal 2 karakter')
    .max(20, 'Kode mapel maksimal 20 karakter'),
  name: z.string().min(2, 'Nama mata pelajaran minimal 2 karakter'),
  level: z.enum(['TK/PAUD', 'SD', 'SMP', 'SMA', 'Umum', 'Semua Jenjang']),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export type SubjectInput = z.infer<typeof subjectSchema>;

export const curriculumTopicSchema = z.object({
  id: z.string().optional(),
  subject_id: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  grade: z.string().min(1, 'Jenjang kelas wajib dipilih'),
  chapter_number: z
    .number()
    .int('Nomor bab harus berupa angka bulat')
    .min(1, 'Nomor bab minimal 1'),
  title: z.string().min(2, 'Judul materi / bab minimal 2 karakter'),
  description: z.string().optional(),
  worksheet_name: z.string().optional(),
  worksheet_url: z.string().optional(),
});

export type CurriculumTopicInput = z.infer<typeof curriculumTopicSchema>;
