import type { SessionStatus } from '@/types/database.types';

export interface SyntheticSession {
  id: string;
  schedule_id?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  tutor_id: string;
  tutor_name: string;
  student_id?: string;
  student_name?: string;
  student_code?: string;
  students?: Array<{
    id: string;
    name: string;
    student_code: string;
  }>;
  class_group_name?: string;
  program_id: string;
  program_name: string;
  bimbel_type_id: string;
  bimbel_type_name: string;
  duration_minutes: number;
  status: SessionStatus;
  rescheduled_from_session_id?: string;
  notes?: string;
}

export const SYNTHETIC_SESSIONS: SyntheticSession[] = [
  {
    id: 'ses-mon-group',
    session_date: '2026-09-14', // Senin mendatang
    start_time: '16:00',
    end_time: '17:15',
    tutor_id: 'tut-001',
    tutor_name: 'Abi Hanif',
    class_group_name: 'Kelas Kelompok Matematika & Logika (Senin 16:00-17:15)',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    duration_minutes: 75,
    status: 'scheduled',
    students: [
      { id: 'std-001', name: 'Alghazy Malik', student_code: 'STD-2026-001' },
      { id: 'std-002', name: 'Najwa Khairunnisa', student_code: 'STD-2026-002' },
      { id: 'std-003', name: 'Dimas Prasetyo', student_code: 'STD-2026-003' },
    ],
    notes: 'Sesi kelompok 3 murid: Eksplorasi materi logika dan penalaran matematika.',
  },
  {
    id: 'ses-today-group',
    session_date: '2026-09-11', // Hari ini
    start_time: '10:00',
    end_time: '11:15',
    tutor_id: 'tut-001',
    tutor_name: 'Abi Hanif',
    class_group_name: 'Kelompok Pagi Intensif (10:00-11:15)',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    duration_minutes: 75,
    status: 'scheduled',
    students: [
      { id: 'std-001', name: 'Alghazy Malik', student_code: 'STD-2026-001' },
      { id: 'std-004', name: 'Aulia Rahmawati', student_code: 'STD-2026-004' },
      { id: 'std-005', name: 'Rizky Ramadhan', student_code: 'STD-2026-005' },
    ],
    notes: 'Sesi aktif hari ini: Latihan problem solving dan review berkala.',
  },
  {
    id: 'ses-mgmt-today',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '15:30',
    tutor_id: 'tut-mgmt-001',
    tutor_name: 'Siti Rahmawati (Owner & Tutor)',
    student_id: 'std-002',
    student_name: 'Najwa Khairunnisa',
    student_code: 'STD-2026-002',
    class_group_name: 'Bimbingan Privat Khusus Owner',
    program_id: 'prg-002',
    program_name: 'Sains Eksperimental',
    bimbel_type_id: 'bt-prv-003',
    bimbel_type_name: 'Private',
    duration_minutes: 90,
    status: 'scheduled',
    students: [
      { id: 'std-002', name: 'Najwa Khairunnisa', student_code: 'STD-2026-002' },
    ],
    notes: 'Sesi Privat Khusus Persiapan Ujian Mandiri bersama Pengajar Manajemen.',
  },
  {
    id: 'ses-001',
    session_date: '2026-09-08',
    start_time: '16:00',
    end_time: '17:00',
    tutor_id: 'tut-002',
    tutor_name: 'Abi Yoko',
    student_id: 'std-001',
    student_name: 'Alghazy Malik',
    student_code: 'STD-2026-001',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    duration_minutes: 60,
    status: 'completed',
    notes: 'P1 (Pertemuan 1): Penjumlahan dan pengurangan pecahan campuran.',
  },
  {
    id: 'ses-002',
    session_date: '2026-09-09',
    start_time: '16:30',
    end_time: '17:45',
    tutor_id: 'tut-003',
    tutor_name: 'Abi Govin',
    student_id: 'std-001',
    student_name: 'Alghazy Malik',
    student_code: 'STD-2026-001',
    program_id: 'prg-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    duration_minutes: 60,
    status: 'completed',
    notes: 'P2 (Pertemuan 2, Tutor pengganti): Latihan soal perkalian pecahan dan desimal.',
  },
  {
    id: 'ses-003',
    session_date: '2026-09-10',
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
    status: 'scheduled',
    notes: 'P3 (Pertemuan 3 Hari ini): Evaluasi mingguan konsep pecahan dan desimal.',
  },
  {
    id: 'ses-004',
    session_date: '2026-09-10',
    start_time: '17:30',
    end_time: '18:45',
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
    status: 'scheduled',
    notes: 'Materi: Sistem Gerak pada Manusia dan Sendi Tulang.',
  },
  {
    id: 'ses-005',
    session_date: '2026-09-07',
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
    status: 'rescheduled',
    notes: 'Siswa izin sakit, dijadwalkan ulang ke Sabtu 12 September 2026.',
  },
  {
    id: 'ses-006',
    session_date: '2026-09-11',
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
    status: 'scheduled',
    notes: 'Speaking drills and vocabulary enrichment.',
  },
  {
    id: 'ses-rescheduled-sat',
    session_date: '2026-09-12',
    start_time: '10:00',
    end_time: '11:30',
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
    status: 'scheduled',
    rescheduled_from_session_id: 'ses-005',
    notes: 'Sesi pengganti (rescheduled dari Senin 7 Sep): Matematika Saintek lanjutan.',
  },
];
