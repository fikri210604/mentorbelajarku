export interface SubjectGroup {
  level: string;
  subjects: string[];
}

export const LANDING_SUBJECTS: SubjectGroup[] = [
  {
    level: 'SD (Kelas 1 - 6)',
    subjects: [
      'Matematika Dasar',
      'IPA / Tematik',
      'Bahasa Indonesia',
      'Bahasa Inggris Dasar',
      'Calistung (Persiapan SD)',
    ],
  },
  {
    level: 'SMP (Kelas 7 - 9)',
    subjects: [
      'Matematika',
      'IPA Terpadu (Fisika & Biologi)',
      'Bahasa Inggris',
      'Bahasa Indonesia',
      'Persiapan Asesmen & Ujian Sekolah',
    ],
  },
  {
    level: 'SMA (Kelas 10 - 12)',
    subjects: [
      'Matematika Wajib & Peminatan',
      'Fisika',
      'Kimia',
      'Biologi',
      'Ekonomi & Akuntansi',
      'Bahasa Inggris Lanjutan',
    ],
  },
  {
    level: 'Persiapan Seleksi PTN (UTBK-SNBT)',
    subjects: [
      'Penalaran Umum (PU)',
      'Pengetahuan Kuantitatif (PK)',
      'Penalaran Matematika (PM)',
      'Literasi Bahasa Indonesia & Inggris',
      'Konsultasi Pemilihan Jurusan',
    ],
  },
];
