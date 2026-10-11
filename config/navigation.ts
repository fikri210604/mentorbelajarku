export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const MANAGEMENT_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/management/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    title: "Akademik & Siswa",
    items: [
      { title: "Data Murid", href: "/management/students", icon: "GraduationCap" },
      { title: "Data Tutor", href: "/management/tutors", icon: "UserCheck" },
      { title: "Jadwal Belajar", href: "/management/schedules", icon: "CalendarDays" },
      { title: "Sesi Belajar", href: "/management/sessions", icon: "Clock" },
      { title: "Presensi Murid", href: "/management/attendance", icon: "CheckCircle2" },
      { title: "Catatan Belajar", href: "/management/learning-records", icon: "BookOpen" },
      { title: "Evaluasi Murid", href: "/management/progress-reports", icon: "FileCheck" },
    ],
  },
  {
    title: "Kurikulum Pembelajaran",
    items: [
      { title: "Mata Pelajaran & Silabus", href: "/management/settings/subjects", icon: "BookMarked" },
      { title: "Program Bimbel", href: "/management/settings/programs", icon: "BookOpen" },
      { title: "Jenis Bimbel & Durasi", href: "/management/settings/bimbel-types", icon: "Layers" },
    ],
  },
  {
    title: "Keuangan & Tarif",
    items: [
      { title: "Paket Belajar Murid", href: "/management/settings/packages", icon: "PackageCheck" },
      { title: "Tarif Honor Tutor", href: "/management/settings/tutor-rates", icon: "Coins" },
      { title: "Gaji Manajemen (Owner)", href: "/management/settings/management-rates", icon: "Building2" },
      { title: "Penggajian", href: "/management/payroll", icon: "CreditCard" },
      { title: "Laporan Penggajian", href: "/management/reports/payroll", icon: "FileText" },
    ],
  },
  {
    title: "Pengaturan Sistem",
    items: [
      { title: "Peran & Hak Akses (RBAC)", href: "/management/settings/roles", icon: "ShieldCheck" },
      { title: "Katalog Permission", href: "/management/settings/permissions", icon: "ShieldCheck" },
      { title: "Pengguna & Peran", href: "/management/settings/users", icon: "ShieldCheck" },
      { title: "Toleransi Jam Presensi", href: "/management/settings/attendance-window", icon: "Clock" },
      { title: "Notifikasi & Pengingat", href: "/management/settings/notifications", icon: "BellRing" },
      { title: "Audit Log & Keamanan", href: "/management/audit-logs", icon: "ShieldAlert" },
    ],
  },
];

export const TUTOR_NAV: NavSection[] = [
  {
    title: "Menu Utama",
    items: [
      { title: "Dashboard", href: "/tutor/dashboard", icon: "LayoutDashboard" },
      { title: "Jadwal Mengajar", href: "/tutor/schedules", icon: "CalendarDays" },
      { title: "Presensi Kelas", href: "/tutor/attendance", icon: "Camera" },
      { title: "Murid Binaan", href: "/tutor/students", icon: "GraduationCap" },
      { title: "Penggajian", href: "/tutor/payroll", icon: "Coins" },
    ],
  },
];
