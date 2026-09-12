export interface SyntheticSchedule {
  id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ... 3=Wednesday
  day_name: string;
  start_time: string;
  end_time: string;
  tutor_id: string;
  tutor_name: string;
  student_id?: string;
  student_name?: string;
  student_code?: string;
  class_group_name?: string;
  program_id: string;
  program_name: string;
  bimbel_type_id: string;
  bimbel_type_name: string;
  duration_minutes: number;
  status: 'active' | 'inactive';
}

export const SYNTHETIC_SCHEDULES: SyntheticSchedule[] = [
  {
    id: 'sch-001',
    day_of_week: 1, // Senin
    day_name: 'Senin',
    start_time: '16:00',
    end_time: '17:00',
    tutor_id: 'tut-001',
    tutor_name: 'Abi Hanif',
    student_id: 'std-001',
    student_name: 'Alghazy Malik',
    student_code: 'STD-2026-001',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    duration_minutes: 60,
    status: 'active',
  },
  {
    id: 'sch-002',
    day_of_week: 2, // Selasa
    day_name: 'Selasa',
    start_time: '16:30',
    end_time: '17:45',
    tutor_id: 'tut-002',
    tutor_name: 'Abi Yoko',
    student_id: 'std-002',
    student_name: 'Najwa Khairunnisa',
    student_code: 'STD-2026-002',
    program_id: 'prg-002',
    program_name: 'IPA Terpadu & Sains Eksplorasi',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    duration_minutes: 75,
    status: 'active',
  },
  {
    id: 'sch-003',
    day_of_week: 3, // Rabu
    day_name: 'Rabu',
    start_time: '19:00',
    end_time: '20:30',
    tutor_id: 'tut-001',
    tutor_name: 'Abi Hanif',
    student_id: 'std-003',
    student_name: 'Dimas Prasetyo',
    student_code: 'STD-2026-003',
    program_id: 'prg-003',
    program_name: 'Matematika Saintek & Penalaran Kuantitatif',
    bimbel_type_id: 'bt-prv-003',
    bimbel_type_name: 'Private',
    duration_minutes: 90,
    status: 'active',
  },
  {
    id: 'sch-004',
    day_of_week: 4, // Kamis
    day_name: 'Kamis',
    start_time: '16:00',
    end_time: '17:00',
    tutor_id: 'tut-003',
    tutor_name: 'Abi Govin',
    class_group_name: 'Kelompok Bahasa Inggris Junior A',
    program_id: 'prg-004',
    program_name: 'Bahasa Inggris Terapan',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    duration_minutes: 60,
    status: 'active',
  },
  {
    id: 'sch-005',
    day_of_week: 5, // Jumat
    day_name: 'Jumat',
    start_time: '14:30',
    end_time: '15:45',
    tutor_id: 'tut-002',
    tutor_name: 'Abi Yoko',
    student_id: 'std-004',
    student_name: 'Zahra Aulia',
    student_code: 'STD-2026-004',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    duration_minutes: 75,
    status: 'active',
  },
];
