"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  ArrowRight,
  Clock,
  GraduationCap,
  CheckCircle2,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart2,
  CalendarX,
  Plus,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "./charts/ChartSkeleton";
import { formatDate } from "@/lib/utils";
import type { DashboardData } from "../queries/dashboard.queries";
import type { Permission } from "@/types/auth";
import { isOwnerRoleName } from "@/lib/permissions/resolver";

const WeeklyBarChart = dynamic(
  () => import("./charts/WeeklyBarChart").then((mod) => mod.WeeklyBarChart),
  {
    loading: () => <ChartSkeleton height="h-72" />,
    ssr: false,
  }
);

const BimbelPieChart = dynamic(
  () => import("./charts/BimbelPieChart").then((mod) => mod.BimbelPieChart),
  {
    loading: () => <ChartSkeleton height="h-56" />,
    ssr: false,
  }
);

interface CurrentUserProp {
  name: string;
  roleName: string;
  permissions: Permission[];
}

interface ManagementDashboardPageProps {
  initialData?: DashboardData;
  currentUser?: CurrentUserProp;
}

export default function ManagementDashboardPage({
  initialData,
  currentUser,
}: ManagementDashboardPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const effectiveRoleName = currentUser?.roleName || "management";
  const isOwner = isOwnerRoleName(effectiveRoleName);
  const permissions = currentUser?.permissions || [];

  const hasPerm = (p: Permission) => isOwner || permissions.includes(p);

  // Helper format YYYY-MM-DD secara waktu lokal
  const getLocalDateStr = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = getLocalDateStr(selectedDate);

  // Cek apakah tanggal memiliki jadwal / sesi belajar
  const hasScheduleOnDate = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    if (initialData?.allScheduledDates?.includes(dateStr)) return true;
    const dayOfWeek = date.getDay();
    return (initialData?.todaySchedules || []).some(
      (sch) => sch.day_of_week === dayOfWeek && sch.status === "active"
    );
  };

  // Filter sesi pembelajaran aktual pada tanggal yang dipilih
  const actualSessions = (initialData?.todaySessions || [])
    .filter((s) => s.session_date === selectedDateStr)
    .map((s) => ({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      bimbel_type_name: s.bimbel_types?.name || "Reguler",
      duration_minutes: s.bimbel_types?.duration_minutes || 60,
      status: s.status,
      program_name: s.programs?.name || "Program Bimbel",
      tutor_name: s.tutors?.profiles?.full_name || "Tutor",
      students: s.students || [],
      student_name: s.students?.[0]?.name || "1 Siswa",
    }));

  // Jika tidak ada sesi tanggal spesifik, generate tampilan dari jadwal rutin aktif hari itu
  const recurringForDay = selectedDate
    ? (initialData?.todaySchedules || [])
        .filter((sch) => sch.day_of_week === selectedDate.getDay() && sch.status === "active")
        .map((sch) => {
          const studentItems = (sch.schedule_students || [])
            .map((ss: { students?: { name?: string } | null }) => ss.students)
            .filter((x): x is { name?: string } => Boolean(x));
          return {
            id: `sch-${sch.id}-${selectedDateStr}`,
            start_time: sch.start_time,
            end_time: sch.end_time,
            bimbel_type_name: sch.bimbel_types?.name || "Reguler",
            duration_minutes: sch.bimbel_types?.duration_minutes || 60,
            status: "scheduled" as const,
            program_name: sch.programs?.name || "Program Bimbel",
            tutor_name: sch.tutors?.profiles?.full_name || "Tutor",
            students: studentItems,
            student_name: studentItems[0]?.name || "1 Siswa",
          };
        })
    : [];

  const displaySessions = actualSessions.length > 0 ? actualSessions : recurringForDay;

  // =========================================================================
  // VIEW KHUSUS OWNER (ABI HERWIN): EKSEKUTIF, DELEGASI & MAKRO
  // =========================================================================
  if (isOwner) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Beranda</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard Eksekutif</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header Eksekutif */}
        <PageHeader
          title={`Selamat Datang, ${currentUser?.name || "Abi Herwin"}`}
          description="Pusat kendali eksekutif bimbingan belajar. Pantau performa makro, status kapasitas pengajar, dan delegasikan wewenang operasional melalui Manajemen Peran."
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-xs">
              <Link href="/management/schedules">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span>Lihat Semua Jadwal</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 shadow-xs">
              <Link href="/management/settings/roles">
                <ShieldCheck className="w-4 h-4" />
                <span>Pusat Manajemen Peran</span>
              </Link>
            </Button>
          </div>
        </PageHeader>

        {/* HERO CARD: PUSAT DELEGASI WEWENANG OPERASIONAL */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sistem Delegasi Mandiri Aktif</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Fokus pada Pengambilan Keputusan & Pertumbuhan Bimbel
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Sebagai Owner, Anda tidak perlu terbebani oleh entri jadwal atau absensi harian satu per satu.
                Seluruh operasional teknis telah didelegasikan kepada divisi{" "}
                <span className="font-semibold text-foreground">Kurikulum</span>,{" "}
                <span className="font-semibold text-foreground">HRD</span>, dan{" "}
                <span className="font-semibold text-foreground">Keuangan</span> sesuai hak akses mereka di database.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
              <Button asChild className="gap-2 shadow-xs text-xs sm:text-sm w-full sm:w-auto">
                <Link href="/management/settings/roles">
                  <KeyRound className="w-4 h-4" />
                  <span>Atur Hak Akses Peran</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                <Link href="/management/settings/users">
                  <Users className="w-4 h-4" />
                  <span>Tugaskan Staf</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI STATS CARDS EKSEKUTIF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-xs hover:shadow-sm transition-shadow border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Total Murid Aktif
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.totalStudents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Siswa terdaftar dalam paket belajar</p>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-shadow border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Kapasitas Tutor
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.totalTutors ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tenaga pendidik terverifikasi</p>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-shadow border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Sesi Hari Ini
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.todaySessions ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {initialData?.stats?.todayCompletedSessions ?? 0} sesi telah diselesaikan
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs hover:shadow-sm transition-shadow border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Batch Payroll Menunggu
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.pendingPayroll ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Siap direview bagian Keuangan</p>
            </CardContent>
          </Card>
        </div>

        {/* GRAFIK ANALITIK MAKRO: AKTIVITAS SESI & DISTRIBUSI BIMBEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bar Chart Sesi Mingguan */}
          <Card className="lg:col-span-8 shadow-xs border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Tren Beban Belajar Mingguan
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Perbandingan sesi selesai vs total terjadwal selama 7 hari terakhir
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyBarChart
                data={
                  initialData?.weeklyTrends && initialData.weeklyTrends.length > 0
                    ? initialData.weeklyTrends
                    : [
                        { day: "Senin", selesai: 0, terjadwal: 0 },
                        { day: "Selasa", selesai: 0, terjadwal: 0 },
                        { day: "Rabu", selesai: 0, terjadwal: 0 },
                        { day: "Kamis", selesai: 0, terjadwal: 0 },
                        { day: "Jumat", selesai: 0, terjadwal: 0 },
                        { day: "Sabtu", selesai: 0, terjadwal: 0 },
                        { day: "Minggu", selesai: 0, terjadwal: 0 },
                      ]
                }
              />
            </CardContent>
          </Card>

          {/* Distribusi Jenis Bimbel */}
          <Card className="lg:col-span-4 shadow-xs border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Distribusi Paket Bimbel
              </CardTitle>
              <CardDescription className="text-xs">
                Porsi jenis bimbingan aktif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BimbelPieChart
                data={
                  initialData?.bimbelTypeDistribution && initialData.bimbelTypeDistribution.length > 0
                    ? initialData.bimbelTypeDistribution
                    : [
                        { name: "Reguler (60m)", value: 0, color: "#3b82f6" },
                        { name: "Intensif (75m)", value: 0, color: "#f59e0b" },
                        { name: "Private (90m)", value: 0, color: "#a855f7" },
                      ]
                }
              />

              {/* Legend */}
              <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                {(initialData?.bimbelTypeDistribution && initialData.bimbelTypeDistribution.length > 0
                  ? initialData.bimbelTypeDistribution
                  : [
                      { name: "Reguler (60m)", value: 0, color: "#3b82f6" },
                      { name: "Intensif (75m)", value: 0, color: "#f59e0b" },
                      { name: "Private (90m)", value: 0, color: "#a855f7" },
                    ]
                ).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value} Sesi</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PUSAT LAPORAN & AUDIT SISTEM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-xs border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Pusat Rekapitulasi & Laporan Eksekutif
              </CardTitle>
              <CardDescription className="text-xs">
                Akses ringkasan performa bulanan bimbel tanpa repot membuka entri satu per satu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/reports/attendance">
                  <span className="text-xs font-semibold">Laporan Rekapitulasi Presensi</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/reports/payroll">
                  <span className="text-xs font-semibold">Laporan Penggajian & Honor Tutor</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/reports/students">
                  <span className="text-xs font-semibold">Laporan Pertumbuhan & Paket Siswa</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/audit-logs">
                  <span className="text-xs font-semibold">Audit Log Keamanan & Jejak Digital</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Integritas Tata Kelola Bimbel
              </CardTitle>
              <CardDescription className="text-xs">
                Sistem RBAC dan proteksi data yang aktif di sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Hak Akses Dinamis:</strong> Setiap peran operasional (Kurikulum, HRD, Keuangan) hanya dapat melihat modul dan tombol yang diizinkan oleh Owner di database.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Kalkulasi Honor Sisi Server:</strong> Perhitungan honor tutor terkunci dan deterministik berdasarkan tarif aktif saat sesi berlangsung dikalikan jumlah anak hadir aktual.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Audit Log Otomatis:</strong> Seluruh mutasi data sensitif seperti penambahan peran, penguncian payroll, dan koreksi presensi dicatat dengan timestamp server.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW STAF OPERASIONAL (NON-OWNER: HRD, KURIKULUM, KEUANGAN, DLL.)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Beranda</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard Operasional</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Dashboard Operasional"
        description="Ringkasan operasional harian bimbingan belajar, kalender jadwal, dan agenda sesi sesuai wewenang peran Anda."
      >
        {hasPerm("schedule:read") && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild size="sm" className="gap-1.5 shadow-xs">
              <Link href="/management/schedules">
                <CalendarDays className="w-4 h-4" />
                <span>Lihat Kalender Jadwal</span>
              </Link>
            </Button>
          </div>
        )}
      </PageHeader>

      {/* KPI Stats Cards (Disaring sesuai hak akses) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasPerm("student:read") && (
          <Card className="shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Total Murid Aktif
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.totalStudents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Terdaftar dalam program aktif</p>
            </CardContent>
          </Card>
        )}

        {hasPerm("tutor:read") && (
          <Card className="shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Total Tutor
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.totalTutors ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Pengajar aktif di sistem</p>
            </CardContent>
          </Card>
        )}

        {hasPerm("session:read") && (
          <Card className="shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Sesi Hari Ini
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.todaySessions ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {initialData?.stats?.todayCompletedSessions ?? 0} sesi selesai
              </p>
            </CardContent>
          </Card>
        )}

        {hasPerm("payroll:read") && (
          <Card className="shadow-xs hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Penggajian Siap Diproses
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{initialData?.stats?.pendingPayroll ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Batch menunggu review</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KALENDER INTERAKTIF & AGENDA SESI (Tampil bila memiliki akses jadwal/sesi) */}
      {(hasPerm("schedule:read") || hasPerm("session:read")) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Widget Kalender */}
          <Card className="lg:col-span-5 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Kalender Sesi Belajar</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hari Ini
                </Button>
              </div>
              <CardDescription className="text-xs">
                Pilih tanggal untuk melihat daftar sesi dan jadwal belajar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-2 sm:p-4 pt-0 gap-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasSchedule: (date) => hasScheduleOnDate(date),
                }}
                className="rounded-lg border border-border w-full max-w-sm"
              />
              {/* Keterangan */}
              <div className="flex items-center justify-center flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-2xs inline-block" />
                  <span className="font-medium text-foreground">Ada Jadwal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-primary inline-block" />
                  <span>Dipilih</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agenda Sesi pada Tanggal Terpilih */}
          <Card className="lg:col-span-7 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Agenda Kelas:</span>
                    <span className="text-primary font-bold">
                      {selectedDate ? formatDate(selectedDate) : "Hari Ini"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Daftar sesi belajar yang terjadwal pada tanggal ini
                  </CardDescription>
                </div>
                {hasPerm("schedule:read") && (
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Link href="/management/schedules">
                      <span>Lihat Semua Jadwal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displaySessions.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed border-border">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <CalendarX className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      Belum Ada Jadwal Sesi pada Tanggal Ini
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Tidak ada sesi belajar yang terjadwal untuk {selectedDate ? formatDate(selectedDate) : "tanggal ini"}.
                    </p>
                  </div>
                  {hasPerm("schedule:create") && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs shadow-xs mt-1">
                      <Link href="/management/schedules/new">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Jadwal Baru</span>
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                displaySessions.map((session) => {
                  const isIntensive = session.bimbel_type_name?.toLowerCase().includes("intensif");
                  const isPrivate = session.bimbel_type_name?.toLowerCase().includes("privat");

                  return (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              isIntensive
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                                : isPrivate
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300"
                            }`}
                          >
                            {session.bimbel_type_name} ({session.duration_minutes}m)
                          </span>
                          <StatusBadge status={session.status} />
                        </div>

                        <h4 className="font-semibold text-sm text-foreground">
                          {session.program_name}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                            {session.tutor_name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {session.students && session.students.length > 1
                              ? `${session.students.length} Siswa (${(session.students as Array<{ name?: string }>).map((s) => s.name).join(", ")})`
                              : session.student_name || "1 Siswa"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                          <Link href={`/management/sessions/${session.id}`}>Detail</Link>
                        </Button>
                        {hasPerm("attendance:create") && (
                          <Button asChild size="sm" className="h-8 text-xs">
                            <Link href={`/management/attendance`}>Presensi</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aksi Cepat Sesuai Hak Akses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Pintasan Kerja</CardTitle>
            <CardDescription className="text-xs">Aksi cepat sesuai wewenang peran Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {hasPerm("student:create") && (
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/students/new">
                  <span className="text-xs font-semibold">Daftarkan Murid Baru</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            )}
            {hasPerm("schedule:create") && (
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/schedules/new">
                  <span className="text-xs font-semibold">Buat Jadwal Belajar Baru</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            )}
            {hasPerm("payroll:read") && (
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/payroll">
                  <span className="text-xs font-semibold">Buka Modul Penggajian Tutor</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            )}
            {hasPerm("curriculum:manage") && (
              <Button asChild variant="outline" className="w-full justify-between h-10">
                <Link href="/management/settings/subjects">
                  <span className="text-xs font-semibold">Kelola Mata Pelajaran & Program</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Integritas Operasional</CardTitle>
            <CardDescription className="text-xs">Aturan sistem & validasi bisnis bimbel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Pemisahan Schedule & Session:</strong> Jadwal adalah rencana rutin, sedangkan sesi merupakan bukti pelaksanaan aktual untuk dasar presensi & payroll.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Kalkulasi Honor Sisi Server:</strong> Tarif dihitung otomatis oleh server berdasarkan kehadiran valid murid.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
