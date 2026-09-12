export interface SyntheticProgram {
  id: string;
  name: string;
  level: string;
  description: string;
  status: 'active' | 'inactive';
}

export const SYNTHETIC_PROGRAMS: SyntheticProgram[] = [
  {
    id: 'prg-001',
    name: 'Matematika Dasar & Logika',
    level: 'SD (Kelas 4-6)',
    description: 'Penguatan konsep pecahan, desimal, geometri dasar, dan operasi hitung.',
    status: 'active',
  },
  {
    id: 'prg-002',
    name: 'IPA Terpadu & Sains Eksplorasi',
    level: 'SMP (Kelas 7-9)',
    description: 'Pemahaman konsep fisika, biologi, dan kimia lingkungan tingkat pertama.',
    status: 'active',
  },
  {
    id: 'prg-003',
    name: 'Matematika Saintek & Penalaran Kuantitatif',
    level: 'SMA (Kelas 10-12)',
    description: 'Kalkulus, aljabar linear, trigonometri, dan strategi lolos seleksi PTN.',
    status: 'active',
  },
  {
    id: 'prg-004',
    name: 'Bahasa Inggris Terapan',
    level: 'SMP & SMA',
    description: 'Grammar mastery, reading comprehension, dan conversational confidence.',
    status: 'active',
  },
];
