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
    title: "Akademik & Operasional",
    items: [
      { title: "Data Murid", href: "/management/students", icon: "GraduationCap" },
      { title: "Data Tutor", href: "/management/tutors", icon: "UserCheck" },
      { title: "Jadwal Rutin", href: "/management/schedules", icon: "CalendarDays" },
      { title: "Sesi Belajar", href: "/management/sessions", icon: "Clock" },
      { title: "Presensi", href: "/management/attendance", icon: "CheckCircle2" },
    ],
  },
  {
    title: "Keuangan & Laporan",
    items: [
      { title: "Honor & Payroll", href: "/management/payroll", icon: "CreditCard" },
      { title: "Laporan Presensi", href: "/management/reports/attendance", icon: "FileText" },
      { title: "Laporan Murid", href: "/management/reports/students", icon: "FileText" },
      { title: "Laporan Tutor", href: "/management/reports/tutors", icon: "FileText" },
      { title: "Laporan Payroll", href: "/management/reports/payroll", icon: "FileText" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { title: "Program Studi", href: "/management/settings/programs", icon: "BookOpen" },
      { title: "Jenis Bimbel", href: "/management/settings/bimbel-types", icon: "Layers" },
      { title: "Paket Belajar", href: "/management/settings/packages", icon: "PackageCheck" },
      { title: "Tarif Tutor", href: "/management/settings/tutor-rates", icon: "Coins" },
      { title: "Gaji Manajemen (Owner)", href: "/management/settings/management-rates", icon: "Building2" },
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
      { title: "Honor Saya", href: "/tutor/payroll", icon: "Coins" },
    ],
  },
];
