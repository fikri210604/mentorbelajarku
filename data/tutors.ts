export interface SyntheticTutor {
  id: string;
  userId: string;
  name: string;
  phone: string;
  bio: string;
  status: 'active' | 'inactive';
  subjects: string[];
}

export const SYNTHETIC_TUTORS: SyntheticTutor[] = [
  {
    id: 'tut-001',
    userId: 'usr-tut-001',
    name: 'Abi Hanif',
    phone: '081298765432',
    bio: 'Pengajar spesialis Matematika dan Penalaran Analitis dengan pengalaman 5+ tahun.',
    status: 'active',
    subjects: ['Matematika SD', 'Matematika SMP', 'Kuantitatif SMA'],
  },
  {
    id: 'tut-002',
    userId: 'usr-tut-002',
    name: 'Abi Yoko',
    phone: '081311223344',
    bio: 'Pengajar Sains dan Fisika interaktif, berfokus pada eksperimen konsep dan pemahaman mendalam.',
    status: 'active',
    subjects: ['IPA SMP', 'Fisika SMA'],
  },
  {
    id: 'tut-003',
    userId: 'usr-tut-003',
    name: 'Abi Govin',
    phone: '081399887766',
    bio: 'Tutor Bahasa Inggris dan persiapan kompetisi akademik dengan gaya belajar menyenangkan.',
    status: 'active',
    subjects: ['Bahasa Inggris', 'Persiapan Ujian'],
  },
  {
    id: 'tut-mgmt-001',
    userId: 'usr-mgmt-owner',
    name: 'Siti Rahmawati (Owner & Tutor)',
    phone: '081234567890',
    bio: 'Founder Bimbel & Pengajar Bimbingan Privat Khusus dan Konsultasi Belajar.',
    status: 'active',
    subjects: ['Bimbingan Privat Khusus', 'Konsultasi Belajar'],
  },
];
