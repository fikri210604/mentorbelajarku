import type { PayrollStatus } from '@/types/database.types';

export interface SyntheticTutorRate {
  id: string;
  tutor_id?: string | null;
  tutor_name?: string | null;
  bimbel_type_id: string;
  bimbel_type_name: string;
  level: string;
  rate_per_student: number;
  effective_from: string;
  effective_until?: string | null;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface SyntheticManagementRate {
  id: string;
  title: string;
  role_level: 'owner' | 'hrd' | 'finance' | 'admin';
  user_name?: string;
  rate_type: 'monthly' | 'allowance' | 'hourly';
  amount: number;
  effective_from: string;
  effective_until?: string | null;
  description?: string;
  status: 'active' | 'inactive';
}

// Standar Honor Tutor per Jenjang & Jenis Bimbel (Sesuai Aturan Bisnis Terbaru)
export const SYNTHETIC_TUTOR_RATES: SyntheticTutorRate[] = [
  {
    id: 'rate-sd-reg',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    level: 'SD',
    rate_per_student: 10000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SD kelas 1-6 untuk bimbel Reguler (Rp10.000/murid).',
  },
  {
    id: 'rate-sd-int',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    level: 'SD',
    rate_per_student: 15000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SD kelas 1-6 untuk bimbel Intensif (Rp15.000/murid).',
  },
  {
    id: 'rate-smp-reg',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    level: 'SMP',
    rate_per_student: 20000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SMP kelas 7-9 untuk bimbel Reguler (Rp20.000/murid).',
  },
  {
    id: 'rate-smp-int',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    level: 'SMP',
    rate_per_student: 20000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SMP kelas 7-9 untuk bimbel Intensif (Rp20.000/murid).',
  },
  {
    id: 'rate-sma-reg',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    level: 'SMA',
    rate_per_student: 25000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SMA kelas 10-12 untuk bimbel Reguler (Rp25.000/murid).',
  },
  {
    id: 'rate-sma-int',
    bimbel_type_id: 'bt-int-002',
    bimbel_type_name: 'Intensif',
    level: 'SMA',
    rate_per_student: 25000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif standar murid SMA kelas 10-12 untuk bimbel Intensif (Rp25.000/murid).',
  },
  {
    id: 'rate-prv-all',
    bimbel_type_id: 'bt-prv-003',
    bimbel_type_name: 'Private',
    level: 'Semua Jenjang',
    rate_per_student: 50000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif bimbingan 1-on-1 private eksklusif (Rp50.000/murid/sesi).',
  },
  {
    id: 'rate-tk-reg',
    bimbel_type_id: 'bt-reg-001',
    bimbel_type_name: 'Reguler',
    level: 'TK',
    rate_per_student: 10000,
    effective_from: '2026-01-01',
    effective_until: null,
    status: 'active',
    notes: 'Tarif bimbingan calistung anak TK (Rp10.000/murid).',
  },
];

// Standar Gaji & Honor Manajemen (Diatur Khusus oleh Owner)
export const SYNTHETIC_MANAGEMENT_RATES: SyntheticManagementRate[] = [
  {
    id: 'mgmt-rate-001',
    title: 'Gaji Pokok HRD & Operasional',
    role_level: 'hrd',
    user_name: 'Dewi Lestari',
    rate_type: 'monthly',
    amount: 2500000,
    effective_from: '2026-01-01',
    effective_until: null,
    description: 'Pengelolaan murid, rekrutmen/evaluasi tutor, dan koordinasi jadwal pembelajaran harian.',
    status: 'active',
  },
  {
    id: 'mgmt-rate-002',
    title: 'Gaji Pokok Keuangan & Finance',
    role_level: 'finance',
    user_name: 'Budi Santoso',
    rate_type: 'monthly',
    amount: 2500000,
    effective_from: '2026-01-01',
    effective_until: null,
    description: 'Pengelolaan kas masuk murid, rekapitulasi honor tutor bulanan, dan laporan laba rugi.',
    status: 'active',
  },
  {
    id: 'mgmt-rate-003',
    title: 'Tunjangan Operasional Pimpinan / Owner',
    role_level: 'owner',
    user_name: 'Siti Rahmawati',
    rate_type: 'allowance',
    amount: 3500000,
    effective_from: '2026-01-01',
    effective_until: null,
    description: 'Tunjangan manajerial dan kepemimpinan strategis bimbel.',
    status: 'active',
  },
  {
    id: 'mgmt-rate-004',
    title: 'Gaji Admin & Layanan Pelanggan',
    role_level: 'admin',
    user_name: 'Staf Administrasi',
    rate_type: 'monthly',
    amount: 1800000,
    effective_from: '2026-01-01',
    effective_until: null,
    description: 'Administrasi presensi, input data pendaftaran murid baru, dan customer service wali murid.',
    status: 'active',
  },
];

export interface SyntheticPayment {
  id: string;
  tutor_id: string;
  tutor_name: string;
  period_start: string;
  period_end: string;
  total_sessions: number;
  payable_students: number;
  gross_amount: number;
  bonus: number;
  deduction: number;
  net_amount: number;
  status: PayrollStatus;
  paid_at?: string;
}

export const SYNTHETIC_PAYMENTS: SyntheticPayment[] = [
  {
    id: 'pay-mgmt-001',
    tutor_id: 'tut-mgmt-001',
    tutor_name: 'Siti Rahmawati (Owner & Tutor)',
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    total_sessions: 6,
    payable_students: 18,
    gross_amount: 450000,
    bonus: 50000,
    deduction: 0,
    net_amount: 500000,
    status: 'paid',
    paid_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'pay-tut-001',
    tutor_id: 'tut-001',
    tutor_name: 'Abi Hanif',
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    total_sessions: 12,
    payable_students: 36,
    gross_amount: 900000,
    bonus: 100000,
    deduction: 0,
    net_amount: 1000000,
    status: 'processed',
  },
];
