import { Permission, Role, ManagementSubrole, PermissionDefinition } from "@/types/auth";

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Kurikulum & Materi
  {
    id: "curriculum:manage",
    category: "Kurikulum & Materi",
    name: "Kelola Master Mata Pelajaran & Program",
    description: "Menambah, mengubah, dan menghapus mapel serta program bimbel",
  },
  {
    id: "material:manage",
    category: "Kurikulum & Materi",
    name: "Kelola Silabus Bab & Materi Belajar",
    description: "Menyusun alur materi, bab silabus, dan deskripsi kompetensi",
  },
  {
    id: "worksheet:manage",
    category: "Kurikulum & Materi",
    name: "Kelola & Review Worksheet Siswa",
    description: "Mengatur master bank soal, worksheet kurikulum, dan hak rilis",
  },
  {
    id: "worksheet:create",
    category: "Kurikulum & Materi",
    name: "Tambah & Unggah Worksheet/Tugas",
    description: "Mengunggah lembar kerja siswa untuk kebutuhan sesi belajar",
  },
  {
    id: "worksheet:read",
    category: "Kurikulum & Materi",
    name: "Lihat & Unduh Lembar Kerja Siswa",
    description: "Melihat serta mengunduh dokumen worksheet siswa",
  },

  // Akademik & Siswa
  {
    id: "student:create",
    category: "Akademik & Siswa",
    name: "Tambah Data Murid",
    description: "Mendaftarkan murid baru ke sistem bimbel",
  },
  {
    id: "student:read",
    category: "Akademik & Siswa",
    name: "Lihat Data Murid",
    description: "Melihat profil, riwayat, dan data kontak murid",
  },
  {
    id: "student:update",
    category: "Akademik & Siswa",
    name: "Ubah Data Murid",
    description: "Memperbarui biodata dan paket aktif murid",
  },
  {
    id: "student:delete",
    category: "Akademik & Siswa",
    name: "Hapus Data Murid",
    description: "Menghapus data murid dari sistem",
  },

  // Tutor & Pengajar
  {
    id: "tutor:create",
    category: "Akademik & Siswa",
    name: "Tambah Data Tutor",
    description: "Merekrut dan menambahkan profil tutor baru",
  },
  {
    id: "tutor:read",
    category: "Akademik & Siswa",
    name: "Lihat Data Tutor",
    description: "Melihat profil dan status keaktifan tutor",
  },
  {
    id: "tutor:update",
    category: "Akademik & Siswa",
    name: "Ubah Data Tutor",
    description: "Mengubah biodata tutor",
  },
  {
    id: "tutor:delete",
    category: "Akademik & Siswa",
    name: "Hapus/Nonaktifkan Tutor",
    description: "Menonaktifkan akses mengajar tutor",
  },

  // Jadwal & Sesi
  {
    id: "schedule:create",
    category: "Akademik & Siswa",
    name: "Buat Jadwal Belajar",
    description: "Menyusun jadwal rutin mingguan tutor dan murid",
  },
  {
    id: "schedule:read",
    category: "Akademik & Siswa",
    name: "Lihat Jadwal Belajar",
    description: "Melihat kalender dan agenda jadwal belajar",
  },
  {
    id: "schedule:update",
    category: "Akademik & Siswa",
    name: "Ubah Jadwal Belajar",
    description: "Menggeser atau menyesuaikan jadwal rutin",
  },
  {
    id: "schedule:delete",
    category: "Akademik & Siswa",
    name: "Hapus Jadwal Belajar",
    description: "Membatalkan jadwal rutin",
  },
  {
    id: "session:create",
    category: "Akademik & Siswa",
    name: "Generate/Buat Sesi Belajar",
    description: "Menerbitkan sesi pembelajaran aktual harian",
  },
  {
    id: "session:read",
    category: "Akademik & Siswa",
    name: "Lihat Sesi Belajar",
    description: "Melihat log sesi pembelajaran",
  },
  {
    id: "session:update",
    category: "Akademik & Siswa",
    name: "Ubah/Reschedule Sesi",
    description: "Melakukan reschedule tanggal atau tutor pengganti",
  },
  {
    id: "session:delete",
    category: "Akademik & Siswa",
    name: "Batalkan Sesi",
    description: "Membatalkan sesi",
  },

  // Presensi & Evaluasi
  {
    id: "attendance:create",
    category: "Presensi & Evaluasi",
    name: "Submit Presensi & Foto Kelas",
    description: "Mengisi kehadiran murid dan mengunggah foto sesi",
  },
  {
    id: "attendance:read",
    category: "Presensi & Evaluasi",
    name: "Lihat Rekap Presensi",
    description: "Melihat absensi dan riwayat kedatangan murid",
  },
  {
    id: "attendance:update",
    category: "Presensi & Evaluasi",
    name: "Koreksi Data Absensi",
    description: "Mengubah status presensi jika terjadi kekeliruan",
  },
  {
    id: "attendance:verify",
    category: "Presensi & Evaluasi",
    name: "Verifikasi Presensi & Bukti Foto",
    description: "Menyetujui dokumentasi presensi untuk validasi honor",
  },
  {
    id: "progress_report:read",
    category: "Presensi & Evaluasi",
    name: "Lihat Evaluasi Perkembangan",
    description: "Melihat rapor perkembangan belajar siswa",
  },
  {
    id: "progress_report:manage",
    category: "Presensi & Evaluasi",
    name: "Kelola & Terbitkan Evaluasi",
    description: "Menyusun dan merilis rapor berkala kepada wali murid",
  },

  // Keuangan & Payroll
  {
    id: "payroll:read",
    category: "Keuangan & Honor",
    name: "Lihat Data Honor / Payroll",
    description: "Melihat rincian honor mengajar dan slip gaji",
  },
  {
    id: "payroll:generate",
    category: "Keuangan & Honor",
    name: "Hitung/Generate Payroll Periode",
    description: "Mengalkulasi otomatis honor tutor berdasarkan kehadiran valid",
  },
  {
    id: "payroll:finalize",
    category: "Keuangan & Honor",
    name: "Finalisasi Payroll",
    description: "Mengunci perhitungan honor",
  },
  {
    id: "payroll:pay",
    category: "Keuangan & Honor",
    name: "Proses Pembayaran & Upload Bukti",
    description: "Menandai honor telah dibayarkan",
  },
  {
    id: "rates:manage",
    category: "Keuangan & Honor",
    name: "Kelola Tarif Belajar & Honor",
    description: "Mengatur tarif bimbel per murid dan standar fee",
  },

  // Sistem & Pengaturan
  {
    id: "roles:manage",
    category: "Sistem & Keamanan",
    name: "Manajemen Role & Hak Akses",
    description: "Mengatur peran kerja dan permission matrix (Khusus Owner)",
  },
  {
    id: "settings:manage",
    category: "Sistem & Keamanan",
    name: "Pengaturan Umum Bimbel",
    description: "Mengatur batas jam toleransi presensi dan master sistem",
  },
  {
    id: "audit:read",
    category: "Sistem & Keamanan",
    name: "Lihat Audit Log Keamanan",
    description: "Melihat catatan jejak digital mutasi data",
  },
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  management: [
    "curriculum:manage",
    "material:manage",
    "worksheet:manage",
    "worksheet:create",
    "worksheet:read",
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
    "progress_report:read",
    "progress_report:manage",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "rates:manage",
    "reports:read",
    "roles:manage",
    "settings:manage",
    "audit:read",
  ],
  admin: [
    "curriculum:manage",
    "material:manage",
    "worksheet:manage",
    "worksheet:create",
    "worksheet:read",
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
    "progress_report:read",
    "progress_report:manage",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "rates:manage",
    "reports:read",
    "settings:manage",
    "audit:read",
  ],
  finance: [
    "attendance:read",
    "session:read",
    "student:read",
    "tutor:read",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "rates:manage",
    "reports:read",
  ],
  tutor: [
    "student:read",
    "schedule:read",
    "session:read",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "worksheet:create",
    "worksheet:read",
    "progress_report:read",
    "progress_report:manage",
    "payroll:read",
  ],
};

/**
 * Granular permissions per Management Subrole (Owner, Kurikulum, HRD, Keuangan).
 */
export const SUBROLE_PERMISSIONS: Record<ManagementSubrole, Permission[]> = {
  // Owner memiliki akses penuh ke seluruh modul sistem
  owner: [
    "curriculum:manage",
    "material:manage",
    "worksheet:manage",
    "worksheet:create",
    "worksheet:read",
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
    "progress_report:read",
    "progress_report:manage",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "rates:manage",
    "reports:read",
    "roles:manage",
    "settings:manage",
    "audit:read",
  ],
  // Bagian Kurikulum: Fokus pada mata pelajaran, silabus, materi, worksheet siswa, evaluasi murid
  curriculum: [
    "curriculum:manage",
    "material:manage",
    "worksheet:manage",
    "worksheet:create",
    "worksheet:read",
    "student:read",
    "tutor:read",
    "schedule:read",
    "session:read",
    "attendance:read",
    "progress_report:read",
    "progress_report:manage",
    "reports:read",
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
    "progress_report:read",
    "reports:read",
    "settings:manage",
  ],
  // Keuangan fokus pada Payroll/Honor, Tarif Tutor, Audit Presensi, dan Laporan Finansial
  finance: [
    "attendance:read",
    "session:read",
    "student:read",
    "tutor:read",
    "payroll:generate",
    "payroll:read",
    "payroll:finalize",
    "payroll:pay",
    "rates:manage",
    "reports:read",
  ],
  // General fallback
  general: [
    "student:read",
    "tutor:read",
    "schedule:read",
    "session:read",
    "attendance:read",
    "worksheet:read",
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
  if (!subrole || !permission) return true;
  return SUBROLE_PERMISSIONS[subrole]?.includes(permission) ?? false;
}

/**
 * Helper untuk menentukan apakah suatu subrole diizinkan mengakses path URL management tertentu.
 */
export function canSubroleAccessRoute(
  subrole?: ManagementSubrole | null,
  pathname?: string
): boolean {
  if (!subrole || subrole === "owner" || !pathname) {
    return true; // Owner memiliki akses penuh
  }

  // Aturan rute untuk Bagian Kurikulum
  if (subrole === "curriculum") {
    // Kurikulum dilarang mengakses Payroll, Tarif/Gaji, dan Manajemen Role
    if (pathname.startsWith("/management/payroll")) return false;
    if (pathname.startsWith("/management/reports/payroll")) return false;
    if (pathname.startsWith("/management/settings/tutor-rates")) return false;
    if (pathname.startsWith("/management/settings/management-rates")) return false;
    if (pathname.startsWith("/management/settings/roles")) return false;
    if (pathname.startsWith("/management/settings/users")) return false;
    if (pathname.startsWith("/management/settings/permissions")) return false;
    if (pathname.startsWith("/management/settings/attendance-window")) return false;
    return true;
  }

  // Aturan rute untuk HRD
  if (subrole === "hrd") {
    // HRD dilarang mengakses modul Payroll, Pengaturan Tarif & Manajemen Role
    if (pathname.startsWith("/management/payroll")) return false;
    if (pathname.startsWith("/management/reports/payroll")) return false;
    if (pathname.startsWith("/management/settings/tutor-rates")) return false;
    if (pathname.startsWith("/management/settings/management-rates")) return false;
    if (pathname.startsWith("/management/settings/roles")) return false;
    if (pathname.startsWith("/management/settings/users")) return false;
    if (pathname.startsWith("/management/settings/permissions")) return false;
    return true;
  }

  // Aturan rute untuk Keuangan
  if (subrole === "finance") {
    if (pathname.startsWith("/management/students")) return false;
    if (pathname.startsWith("/management/tutors")) return false;
    if (pathname.startsWith("/management/schedules")) return false;
    if (pathname.startsWith("/management/sessions")) return false;
    if (pathname.startsWith("/management/settings/subjects")) return false;
    if (pathname.startsWith("/management/settings/programs")) return false;
    if (pathname.startsWith("/management/settings/bimbel-types")) return false;
    if (pathname.startsWith("/management/settings/management-rates")) return false;
    if (pathname.startsWith("/management/settings/roles")) return false;
    if (pathname.startsWith("/management/settings/users")) return false;
    if (pathname.startsWith("/management/settings/permissions")) return false;
    return true;
  }

  return true;
}
