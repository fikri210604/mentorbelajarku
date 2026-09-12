import type { UserRole } from '@/types/database.types';
import type { ManagementSubrole } from '@/types/auth';

export interface SyntheticUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subrole?: ManagementSubrole;
  phone: string;
  avatarUrl?: string;
  tutorId?: string;
  mustChangePassword?: boolean;
}

export const SYNTHETIC_USERS: SyntheticUser[] = [
  {
    id: 'usr-mgmt-owner',
    name: 'Siti Rahmawati (Owner & Tutor)',
    email: 'owner@mentorbelajarku.com',
    role: 'management',
    subrole: 'owner',
    phone: '081234567890',
    tutorId: 'tut-mgmt-001',
    mustChangePassword: false,
  },
  {
    id: 'usr-mgmt-hrd',
    name: 'Dewi Lestari (HRD - Murid & Tutor)',
    email: 'hrd@mentorbelajarku.com',
    role: 'management',
    subrole: 'hrd',
    phone: '081234567891',
    mustChangePassword: false,
  },
  {
    id: 'usr-mgmt-finance',
    name: 'Budi Santoso (Keuangan)',
    email: 'keuangan@mentorbelajarku.com',
    role: 'management',
    subrole: 'finance',
    phone: '081234567892',
    mustChangePassword: false,
  },
  {
    id: 'usr-mgmt-001',
    name: 'Management General',
    email: 'management@mentorbelajarku.com',
    role: 'management',
    subrole: 'owner',
    phone: '081234567899',
    mustChangePassword: false,
  },
  {
    id: 'usr-tut-001',
    name: 'Abi Hanif',
    email: 'hanif@mentorbelajarku.com',
    role: 'tutor',
    phone: '081298765432',
    tutorId: 'tut-001',
    mustChangePassword: true,
  },
  {
    id: 'usr-tut-002',
    name: 'Abi Yoko',
    email: 'yoko@mentorbelajarku.com',
    role: 'tutor',
    phone: '081311223344',
    tutorId: 'tut-002',
    mustChangePassword: true,
  },
  {
    id: 'usr-tut-003',
    name: 'Abi Govin',
    email: 'govin@mentorbelajarku.com',
    role: 'tutor',
    phone: '081399887766',
    tutorId: 'tut-003',
    mustChangePassword: true,
  },
  {
    id: 'usr-adm-001',
    name: 'Admin Bimbel',
    email: 'admin@mentorbelajarku.com',
    role: 'admin',
    subrole: 'owner',
    phone: '081122334455',
  },
];

export const DEFAULT_SYNTHETIC_USER = SYNTHETIC_USERS[0]; // Owner by default

