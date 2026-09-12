export interface SyntheticStudent {
  id: string;
  student_code: string;
  name: string;
  gender: 'male' | 'female';
  school: string;
  grade: string;
  parent_name: string;
  parent_phone: string;
  address: string;
  status: 'active' | 'inactive' | 'graduated';
  enrolled_program: string;
  bimbel_type: string;
}

export const SYNTHETIC_STUDENTS: SyntheticStudent[] = [
  {
    id: 'std-001',
    student_code: 'STD-2026-001',
    name: 'Alghazy Malik',
    gender: 'male',
    school: 'SD Islam Al-Azhar',
    grade: '5 SD',
    parent_name: 'Bpk. Hendra Malik',
    parent_phone: '081288776655',
    address: 'Jl. Melati No. 12, Kebayoran',
    status: 'active',
    enrolled_program: 'Matematika Dasar & Logika',
    bimbel_type: 'Reguler',
  },
  {
    id: 'std-002',
    student_code: 'STD-2026-002',
    name: 'Najwa Khairunnisa',
    gender: 'female',
    school: 'SMP Negeri 1',
    grade: '8 SMP',
    parent_name: 'Ibu Ratna Dewi',
    parent_phone: '081377665544',
    address: 'Komplek Permata Hijau Blok C',
    status: 'active',
    enrolled_program: 'IPA Terpadu & Sains Eksplorasi',
    bimbel_type: 'Intensif',
  },
  {
    id: 'std-003',
    student_code: 'STD-2026-003',
    name: 'Dimas Prasetyo',
    gender: 'male',
    school: 'SMA Negeri 3',
    grade: '12 SMA',
    parent_name: 'Bpk. Bambang Prasetyo',
    parent_phone: '081199887766',
    address: 'Jl. Anggrek No. 45, Bintaro',
    status: 'active',
    enrolled_program: 'Matematika Saintek & Penalaran Kuantitatif',
    bimbel_type: 'Private',
  },
  {
    id: 'std-004',
    student_code: 'STD-2026-004',
    name: 'Zahra Aulia',
    gender: 'female',
    school: 'SD Cendekia Mandiri',
    grade: '6 SD',
    parent_name: 'Ibu Anita Rahayu',
    parent_phone: '081544332211',
    address: 'Jl. Flamboyan No. 8',
    status: 'active',
    enrolled_program: 'Matematika Dasar & Logika',
    bimbel_type: 'Reguler',
  },
  {
    id: 'std-005',
    student_code: 'STD-2026-005',
    name: 'Farel Pratama',
    gender: 'male',
    school: 'SMP Harapan Bangsa',
    grade: '9 SMP',
    parent_name: 'Bpk. Gunawan Pratama',
    parent_phone: '081900112233',
    address: 'Jl. Kemang Raya No. 19',
    status: 'active',
    enrolled_program: 'Bahasa Inggris Terapan',
    bimbel_type: 'Intensif',
  },
  {
    id: 'std-006',
    student_code: 'STD-2026-006',
    name: 'Kenzo Alif',
    gender: 'male',
    school: 'SMA Taruna Nusantara',
    grade: '12 SMA',
    parent_name: 'Bpk. Surya Dharma',
    parent_phone: '081255667788',
    address: 'Jl. Senopati No. 3',
    status: 'graduated',
    enrolled_program: 'Matematika Saintek & Penalaran Kuantitatif',
    bimbel_type: 'Private',
  },
];
