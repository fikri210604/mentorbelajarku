import type { AttendanceStatus, VerificationStatus } from '@/types/database.types';

export interface SyntheticAttendance {
  id: string;
  session_id: string;
  session_date: string;
  student_id: string;
  student_name: string;
  student_code: string;
  program_name: string;
  bimbel_type_name: string;
  tutor_name: string;
  status: AttendanceStatus;
  verification_status: VerificationStatus;
  material: string;
  notes?: string;
  photo_path?: string;
  checked_in_at: string;
  verified_at?: string;
}

export const SYNTHETIC_ATTENDANCE: SyntheticAttendance[] = [
  {
    id: 'att-001',
    session_id: 'ses-001',
    session_date: '2026-09-08',
    student_id: 'std-001',
    student_name: 'Alghazy Malik',
    student_code: 'STD-2026-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_name: 'Reguler',
    tutor_name: 'Abi Yoko',
    status: 'present',
    verification_status: 'verified',
    material: 'Operasi hitung pecahan biasa dan campuran.',
    notes: 'Alghazy sangat antusias dan menyelesaikan 8 dari 10 soal dengan benar.',
    photo_path: 'attendance/2026/09/ses-001/std-001.jpg',
    checked_in_at: '2026-09-08 16:05:00',
    verified_at: '2026-09-08 18:00:00',
  },
  {
    id: 'att-002',
    session_id: 'ses-002',
    session_date: '2026-09-09',
    student_id: 'std-001',
    student_name: 'Alghazy Malik',
    student_code: 'STD-2026-001',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_name: 'Reguler',
    tutor_name: 'Abi Govin',
    status: 'present',
    verification_status: 'submitted',
    material: 'Perkalian pecahan desimal dan pembulatan angka.',
    notes: 'Perlu latihan tambahan di bagian pembagian desimal.',
    photo_path: 'attendance/2026/09/ses-002/std-001.jpg',
    checked_in_at: '2026-09-09 16:32:00',
  },
  {
    id: 'att-003',
    session_id: 'ses-005',
    session_date: '2026-09-07',
    student_id: 'std-003',
    student_name: 'Dimas Prasetyo',
    student_code: 'STD-2026-003',
    program_name: 'Matematika Saintek & Penalaran Kuantitatif',
    bimbel_type_name: 'Private',
    tutor_name: 'Abi Hanif',
    status: 'permission',
    verification_status: 'verified',
    material: 'Fungsi Invers & Komposisi (Ditunda)',
    notes: 'Siswa demam, orang tua konfirmasi via WhatsApp. Kuota pertemuan utuh, dijadwalkan ulang.',
    checked_in_at: '2026-09-07 18:00:00',
    verified_at: '2026-09-07 18:30:00',
  },
  {
    id: 'att-004',
    session_id: 'ses-001',
    session_date: '2026-09-05',
    student_id: 'std-004',
    student_name: 'Zahra Aulia',
    student_code: 'STD-2026-004',
    program_name: 'Matematika Dasar & Logika',
    bimbel_type_name: 'Intensif',
    tutor_name: 'Abi Yoko',
    status: 'present',
    verification_status: 'verified',
    material: 'Bangun Datar: Luas Permukaan dan Keliling.',
    notes: 'Pemahaman konsep segitiga dan trapesium sangat baik.',
    photo_path: 'attendance/2026/09/ses-001/std-004.jpg',
    checked_in_at: '2026-09-05 14:31:00',
    verified_at: '2026-09-05 16:00:00',
  },
  {
    id: 'att-005',
    session_id: 'ses-002',
    session_date: '2026-09-04',
    student_id: 'std-005',
    student_name: 'Farel Pratama',
    student_code: 'STD-2026-005',
    program_name: 'Bahasa Inggris Terapan',
    bimbel_type_name: 'Intensif',
    tutor_name: 'Abi Govin',
    status: 'late',
    verification_status: 'verified',
    material: 'Present Perfect Tense vs Simple Past.',
    notes: 'Hadir terlambat 15 menit karena hujan lebat.',
    checked_in_at: '2026-09-04 16:45:00',
    verified_at: '2026-09-04 18:00:00',
  },
];

export function recordSyntheticAttendance(entry: SyntheticAttendance) {
  const existingIndex = SYNTHETIC_ATTENDANCE.findIndex(
    (a) => a.session_id === entry.session_id && a.student_id === entry.student_id
  );
  if (existingIndex >= 0) {
    SYNTHETIC_ATTENDANCE[existingIndex] = entry;
  } else {
    SYNTHETIC_ATTENDANCE.unshift(entry);
  }
}

