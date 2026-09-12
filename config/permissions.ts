import { Permission, Role, ManagementSubrole } from "@/types/auth";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  management: [
    "student:create",
    "student:read",
    "student:update",
    "student:delete",
    "tutor:create",
    "tutor:read",
    "tutor:update",
    "tutor:delete",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "session:create",
    "session:read",
    "session:update",
    "session:delete",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "attendance:verify",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "reports:read",
    "settings:manage",
  ],
  admin: [
    "student:create",
    "student:read",
    "student:update",
    "student:delete",
    "tutor:create",
    "tutor:read",
    "tutor:update",
    "tutor:delete",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "session:create",
    "session:read",
    "session:update",
    "session:delete",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "attendance:verify",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "reports:read",
    "settings:manage",
  ],
  finance: [
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "reports:read",
  ],
  tutor: [
    "student:read",
    "schedule:read",
    "session:read",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "payroll:read",
  ],
};

/**
 * Granular permissions per Management Subrole (HRD, Keuangan, Owner).
 * Memudahkan penambahan subrole baru di masa depan tanpa mengubah skema database.
 */
export const SUBROLE_PERMISSIONS: Record<ManagementSubrole, Permission[]> = {
  // Owner memiliki akses penuh ke seluruh modul sistem
  owner: [
    "student:create",
    "student:read",
    "student:update",
    "student:delete",
    "tutor:create",
    "tutor:read",
    "tutor:update",
    "tutor:delete",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "session:create",
    "session:read",
    "session:update",
    "session:delete",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "attendance:verify",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "reports:read",
    "settings:manage",
  ],
  // HRD fokus pada pengelolaan Murid, Tutor, Jadwal, Sesi, dan Verifikasi Presensi
  hrd: [
    "student:create",
    "student:read",
    "student:update",
    "student:delete",
    "tutor:create",
    "tutor:read",
    "tutor:update",
    "tutor:delete",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "session:create",
    "session:read",
    "session:update",
    "session:delete",
    "attendance:read",
    "attendance:verify",
    "reports:read",
    "settings:manage",
  ],
  // Keuangan fokus pada Payroll/Honor, Tarif Tutor, Audit Presensi, dan Laporan Finansial
  finance: [
    "attendance:read",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "reports:read",
    "settings:manage",
  ],
  // General fallback
  general: [
    "student:read",
    "tutor:read",
    "schedule:read",
    "session:read",
    "attendance:read",
    "reports:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasSubrolePermission(
  subrole?: ManagementSubrole | null,
  permission?: Permission
): boolean {
  if (!subrole || !permission) return true; // Default allow jika subrole belum diset
  return SUBROLE_PERMISSIONS[subrole]?.includes(permission) ?? false;
}

/**
 * Helper untuk menentukan apakah suatu subrole diizinkan mengakses path URL management tertentu.
 */
export function canSubroleAccessRoute(
  subrole?: ManagementSubrole | null,
  pathname?: string
): boolean {
  if (!subrole || subrole === "owner" || subrole === "general" || !pathname) {
    return true; // Owner memiliki akses penuh
  }

  // Aturan rute untuk HRD
  if (subrole === "hrd") {
    // HRD dilarang mengakses modul Payroll & Pengaturan Tarif
    if (pathname.startsWith("/management/payroll")) return false;
    if (pathname.startsWith("/management/reports/payroll")) return false;
    if (pathname.startsWith("/management/settings/tutor-rates")) return false;
    if (pathname.startsWith("/management/settings/management-rates")) return false;
    return true;
  }

  // Aturan rute untuk Keuangan
  if (subrole === "finance") {
    // Keuangan dilarang mengotak-atik master data murid, tutor, atau jadwal
    // dan gaji manajemen hanya boleh diatur oleh Owner
    if (pathname.startsWith("/management/students")) return false;
    if (pathname.startsWith("/management/tutors")) return false;
    if (pathname.startsWith("/management/schedules")) return false;
    if (pathname.startsWith("/management/sessions")) return false;
    if (pathname.startsWith("/management/settings/programs")) return false;
    if (pathname.startsWith("/management/settings/bimbel-types")) return false;
    if (pathname.startsWith("/management/settings/management-rates")) return false;
    return true;
  }

  return true;
}

