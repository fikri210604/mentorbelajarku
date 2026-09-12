export interface SyntheticBimbelType {
  id: string;
  name: 'Reguler' | 'Intensif' | 'Private';
  duration_minutes: number;
  description: string;
  status: 'active' | 'inactive';
}

export const SYNTHETIC_BIMBEL_TYPES: SyntheticBimbelType[] = [
  {
    id: 'bt-reg-001',
    name: 'Reguler',
    duration_minutes: 60,
    description: 'Format pembelajaran standar 60 menit dengan penguatan konsep terstruktur.',
    status: 'active',
  },
  {
    id: 'bt-int-002',
    name: 'Intensif',
    duration_minutes: 75,
    description: 'Format pembelajaran 75 menit untuk percepatan materi dan persiapan ujian.',
    status: 'active',
  },
  {
    id: 'bt-prv-003',
    name: 'Private',
    duration_minutes: 90,
    description: 'Bimbingan 1-on-1 eksklusif 90 menit dengan personalisasi mendalam.',
    status: 'active',
  },
];
