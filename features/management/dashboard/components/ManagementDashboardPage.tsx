"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  ArrowRight,
  Clock,
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart2,
  CalendarX,
  Plus,
  Shield,
  Briefcase,
  CircleDollarSign,
  ArrowLeftRight,
  Loader2,
  UserCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { SYNTHETIC_SESSIONS, type SyntheticSession } from "@/data/sessions";
import { SYNTHETIC_SCHEDULES } from "@/data/schedules";
import { SYNTHETIC_USERS } from "@/data/users";
import { loginWithSyntheticUser } from "@/features/auth/actions/auth.actions";
import type { ManagementSubrole } from "@/types/auth";
import { formatDate, cn } from "@/lib/utils";

interface DashboardStats {
  totalStudents?: number;
  totalTutors?: number;
  todaySessions?: number;
  totalPayrollDraft?: number;
}

// Data tren sesi mingguan untuk grafik Recharts
const WEEKLY_SESSION_DATA = [
  { day: "Senin", selesai: 6, terjadwal: 8 },
  { day: "Selasa", selesai: 7, terjadwal: 7 },
  { day: "Rabu", selesai: 5, terjadwal: 9 },
  { day: "Kamis", selesai: 8, terjadwal: 8 },
  { day: "Jumat", selesai: 6, terjadwal: 6 },
  { day: "Sabtu", selesai: 9, terjadwal: 10 },
  { day: "Minggu", selesai: 2, terjadwal: 3 },
];

const BIMBEL_TYPE_DATA = [
  { name: "Reguler (60m)", value: 24, color: "#3b82f6" },
  { name: "Intensif (75m)", value: 14, color: "#f59e0b" },
  { name: "Private (90m)", value: 8, color: "#a855f7" },
];

export default function ManagementDashboardPage({ stats }: { stats?: DashboardStats }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // State Role & Identitas Demo Aktif
  const [activeUserId, setActiveUserId] = useState<string>("usr-mgmt-owner");
  const [activeUserName, setActiveUserName] = useState<string>("Siti Rahmawati");
  const [activeSubrole, setActiveSubrole] = useState<ManagementSubrole | null>("owner");
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)synthetic_user_id=([^;]+)/);
      if (match && match[1]) {
        const found = SYNTHETIC_USERS.find(
          (u) => u.id === match[1] || u.email.toLowerCase() === match[1].toLowerCase()
        );
        if (found) {
          setActiveUserId(found.id);
          setActiveUserName(found.name);
          setActiveSubrole(found.subrole || (found.role === "management" ? "owner" : null));
        }
      }
    }
  }, []);

  const handleSwitchRole = async (targetUserId: string) => {
    if (targetUserId === activeUserId && !isSwitching) return;
    try {
      setIsSwitching(true);
      const result = await loginWithSyntheticUser(targetUserId);
      if (result.success && result.user) {
        document.cookie = `synthetic_user_id=${result.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `better-auth.session_token=synthetic-${result.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        window.location.href = result.redirectTo;
      } else {
        setIsSwitching(false);
      }
    } catch (err) {
      console.error("Gagal switch role:", err);
      setIsSwitching(false);
    }
  };

  const getSubroleDisplay = (sub?: ManagementSubrole | null) => {
    switch (sub) {
      case "hrd":
        return {
          label: "HRD & Operasional",
          badgeClass:
            "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
          description:
            "Hak akses: Pengelolaan Data Murid, Tutor, Jadwal, Sesi Belajar, Absensi, dan Laporan Kehadiran.",
        };
      case "finance":
        return {
          label: "Keuangan & Payroll",
          badgeClass:
            "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
          description:
            "Hak akses: Kalkulasi & Pembayaran Honor Tutor, Pengaturan Tarif Bimbel, dan Laporan Payroll.",
        };
      case "owner":
      default:
        return {
          label: "Owner / Super Admin",
          badgeClass:
            "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
          description:
            "Hak akses penuh: Mengakses seluruh modul manajemen, operasional murid/tutor, payroll, laporan, dan konfigurasi master.",
        };
    }
  };

  const currentSubroleInfo = getSubroleDisplay(activeSubrole);

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
    // 1. Cek sesi aktual pada tanggal tersebut
    const hasActualSession = SYNTHETIC_SESSIONS.some((s) => s.session_date === dateStr);
    if (hasActualSession) return true;
    // 2. Cek jadwal rutin aktif berdasarkan hari dalam seminggu
    const dayOfWeek = date.getDay();
    const hasRecurringSchedule = SYNTHETIC_SCHEDULES.some(
      (sch) => sch.day_of_week === dayOfWeek && sch.status === "active"
    );
    return hasRecurringSchedule;
  };

  // Filter sesi pembelajaran aktual pada tanggal yang dipilih
  const actualSessions = SYNTHETIC_SESSIONS.filter(
    (s) => s.session_date === selectedDateStr
  );

  // Jika tidak ada sesi tanggal spesifik, generate tampilan dari jadwal rutin aktif hari itu
  const recurringForDay: SyntheticSession[] = selectedDate
    ? SYNTHETIC_SCHEDULES.filter(
        (sch) => sch.day_of_week === selectedDate.getDay() && sch.status === "active"
      ).map((sch) => ({
        id: `recurring-${sch.id}-${selectedDateStr}`,
        session_date: selectedDateStr,
        start_time: sch.start_time,
        end_time: sch.end_time,
        tutor_id: sch.tutor_id,
        tutor_name: sch.tutor_name,
        student_id: sch.student_id,
        student_name: sch.student_name,
        student_code: sch.student_code,
        students: sch.student_id
          ? [
              {
                id: sch.student_id,
                name: sch.student_name || "Murid",
                student_code: sch.student_code || "",
              },
            ]
          : undefined,
        class_group_name: sch.class_group_name,
        program_id: sch.program_id,
        program_name: sch.program_name,
        bimbel_type_id: sch.bimbel_type_id,
        bimbel_type_name: sch.bimbel_type_name,
        duration_minutes: sch.duration_minutes,
        status: "scheduled" as const,
        notes: `Jadwal rutin mingguan (${sch.day_name})`,
      }))
    : [];

  const displaySessions = actualSessions.length > 0 ? actualSessions : recurringForDay;

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
            <BreadcrumbPage>Dashboard Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Dashboard Management"
        description="Ringkasan operasional harian bimbingan belajar, kalender jadwal, dan analitik kehadiran."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={isSwitching}
            onClick={() => handleSwitchRole("usr-tut-001")}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs"
          >
            {isSwitching && activeUserId === "usr-tut-001" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Mode Tutor (Mengajar)</span>
          </Button>

          <Button asChild size="sm" className="gap-1.5 shadow-xs">
            <Link href="/management/schedules">
              <CalendarDays className="w-4 h-4" />
              <span>Lihat Kalender Jadwal</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Quick Role & Persona Switcher Banner */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs overflow-hidden">
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Peran Aktif:
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                      currentSubroleInfo.badgeClass
                    )}
                  >
                    {currentSubroleInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    • Pengguna: <strong className="text-foreground">{activeUserName}</strong>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {currentSubroleInfo.description}
                </p>
              </div>
            </div>

            {/* Tombol Pilihan Switch Role Langsung */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1 lg:pt-0">
              <Button
                size="sm"
                variant={activeUserId === "usr-mgmt-owner" ? "default" : "outline"}
                disabled={isSwitching}
                onClick={() => handleSwitchRole("usr-mgmt-owner")}
                className={cn(
                  "text-xs h-8 px-2.5 sm:px-3 gap-1.5 transition-all",
                  activeUserId === "usr-mgmt-owner" &&
                    "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                )}
              >
                {isSwitching && activeUserId === "usr-mgmt-owner" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-purple-400" />
                )}
                <span>👑 Owner</span>
              </Button>

              <Button
                size="sm"
                variant={activeUserId === "usr-mgmt-hrd" ? "default" : "outline"}
                disabled={isSwitching}
                onClick={() => handleSwitchRole("usr-mgmt-hrd")}
                className={cn(
                  "text-xs h-8 px-2.5 sm:px-3 gap-1.5 transition-all",
                  activeUserId === "usr-mgmt-hrd" &&
                    "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                )}
              >
                {isSwitching && activeUserId === "usr-mgmt-hrd" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                )}
                <span>👥 HRD</span>
              </Button>

              <Button
                size="sm"
                variant={activeUserId === "usr-mgmt-finance" ? "default" : "outline"}
                disabled={isSwitching}
                onClick={() => handleSwitchRole("usr-mgmt-finance")}
                className={cn(
                  "text-xs h-8 px-2.5 sm:px-3 gap-1.5 transition-all",
                  activeUserId === "usr-mgmt-finance" &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                )}
              >
                {isSwitching && activeUserId === "usr-mgmt-finance" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CircleDollarSign className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>💰 Keuangan</span>
              </Button>

              <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

              <Button
                size="sm"
                variant="outline"
                disabled={isSwitching}
                onClick={() => handleSwitchRole("usr-tut-001")}
                className="text-xs h-8 px-2.5 sm:px-3 gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                {isSwitching && activeUserId === "usr-tut-001" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>🎓 Mode Tutor</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold">{stats?.totalStudents ?? 42}</div>
            <p className="text-xs text-muted-foreground mt-1">Terdaftar dalam program aktif</p>
          </CardContent>
        </Card>

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
            <div className="text-2xl font-bold">{stats?.totalTutors ?? 12}</div>
            <p className="text-xs text-muted-foreground mt-1">Pengajar aktif</p>
          </CardContent>
        </Card>

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
            <div className="text-2xl font-bold">{stats?.todaySessions ?? 8}</div>
            <p className="text-xs text-muted-foreground mt-1">Jadwal belajar berjalan</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Payroll Siap Diproses
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPayrollDraft ?? 3}</div>
            <p className="text-xs text-muted-foreground mt-1">Menunggu review manajemen</p>
          </CardContent>
        </Card>
      </div>

      {/* KALENDER INTERAKTIF & AGENDA SESI */}
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
            {/* Keterangan / Legend Warna Kalender */}
            <div className="flex items-center justify-center flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-2xs inline-block" />
                <span className="font-medium text-foreground">Ada Jadwal (Warna Gelap)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-primary inline-block" />
                <span>Dipilih</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded border border-dashed border-border inline-block" />
                <span>Kosong</span>
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
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Link href="/management/schedules">
                  <span>Lihat Semua Jadwal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
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
                    Tidak ada sesi belajar yang terjadwal untuk {selectedDate ? formatDate(selectedDate) : "tanggal ini"}. Silakan pilih tanggal lain atau buat jadwal baru.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs shadow-xs mt-1">
                  <Link href="/management/schedules/new">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Jadwal Baru</span>
                  </Link>
                </Button>
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
                            ? `${session.students.length} Siswa (${session.students.map((s) => s.name).join(", ")})`
                            : session.student_name || "1 Siswa"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                        <Link href={`/management/sessions/${session.id}`}>Detail</Link>
                      </Button>
                      <Button asChild size="sm" className="h-8 text-xs">
                        <Link href={`/management/attendance`}>Presensi</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAFIK ANALITIK RECHARTS: AKTIVITAS SESI & DISTRIBUSI BIMBEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart Sesi Mingguan */}
        <Card className="lg:col-span-8 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Aktivitas Sesi Belajar Mingguan
                </CardTitle>
                <CardDescription className="text-xs">
                  Perbandingan sesi selesai vs total terjadwal selama 7 hari
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_SESSION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Bar dataKey="selesai" name="Sesi Terlaksana" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terjadwal" name="Total Terjadwal" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribusi Jenis Bimbel */}
        <Card className="lg:col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Distribusi Jenis Bimbel
            </CardTitle>
            <CardDescription className="text-xs">
              Porsi paket bimbingan aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BIMBEL_TYPE_DATA}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {BIMBEL_TYPE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend manual */}
            <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
              {BIMBEL_TYPE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value} Kelas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aksi Cepat & Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat Manajemen</CardTitle>
            <CardDescription className="text-xs">Pintasan operasional harian yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button asChild variant="outline" className="w-full justify-between h-10">
              <Link href="/management/students/new">
                <span className="text-xs font-semibold">Daftarkan Murid Baru</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between h-10">
              <Link href="/management/schedules/new">
                <span className="text-xs font-semibold">Buat Jadwal Belajar Baru</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between h-10">
              <Link href="/management/payroll">
                <span className="text-xs font-semibold">Kelola Honor & Payroll Tutor</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between h-10">
              <Link href="/management/settings">
                <span className="text-xs font-semibold">Pengaturan Master & Tarif Bimbel</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </Button>
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
                <strong className="text-foreground">Kalkulasi Honor Sisi Server:</strong> Tarif dihitung berdasarkan jenjang (SD, SMP, SMA) dan jenis bimbel dikalikan jumlah anak hadir aktual.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Foto Presensi Terenkripsi:</strong> Seluruh bukti kehadiran tersimpan di storage terenkripsi dengan validasi ukuran dan tipe file.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
