"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Camera,
  CalendarDays,
  ArrowRight,
  KeyRound,
  Clock,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  CalendarX,
  ChevronRight,
  Banknote,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";

interface DashboardStudent {
  id: string;
  name?: string;
  student_code?: string;
}

interface DashboardSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  students?: DashboardStudent[];
  student_name?: string;
  program_name?: string;
  bimbel_type_name?: string;
  duration_minutes?: number;
}

interface DashboardSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: string;
  students?: DashboardStudent[];
  program_name?: string;
  bimbel_type_name?: string;
  duration_minutes?: number;
}

interface TutorDashboardPageProps {
  mustChangePassword?: boolean;
  tutorName?: string;
  sessions?: DashboardSession[];
  schedules?: DashboardSchedule[];
  /** Estimasi honor bulan berjalan, dihitung server-side (null = tarif belum diatur / gagal kalkulasi). */
  estMonthlyPayroll?: number | null;
}

function formatCompactIDR(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`;
  return `Rp ${n}`;
}

function getGreeting(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function TutorDashboardPage({
  mustChangePassword = false,
  tutorName = "Tutor",
  sessions = [],
  schedules = [],
  estMonthlyPayroll = null,
}: TutorDashboardPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const now = new Date();
  const hour = now.getHours();
  const greeting = getGreeting(hour);

  // Helper format YYYY-MM-DD secara waktu lokal
  const getLocalDateStr = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getLocalDateStr(new Date());
  const selectedDateStr = getLocalDateStr(selectedDate);

  // Helper cek apakah tutor memiliki jadwal pada tanggal tersebut
  const hasScheduleOnDate = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    if (sessions.some((s) => s.session_date === dateStr)) return true;
    const dayOfWeek = date.getDay();
    return schedules.some((sch) => sch.day_of_week === dayOfWeek && sch.status === "active");
  };

  // Sesi tutor aktual pada tanggal yang dipilih
  const actualTutorSessions = sessions.filter((s) => s.session_date === selectedDateStr);

  // Jika tidak ada sesi spesifik tanggal, generate dari jadwal rutin aktif
  const recurringTutorForDay: DashboardSession[] = selectedDate
    ? schedules
        .filter((sch) => sch.day_of_week === selectedDate.getDay() && sch.status === "active")
        .map((sch) => ({
          id: `rec-${sch.id}-${selectedDateStr}`,
          session_date: selectedDateStr,
          start_time: sch.start_time,
          end_time: sch.end_time,
          students: sch.students,
          student_name: sch.students?.[0]?.name,
          program_name: sch.program_name,
          bimbel_type_name: sch.bimbel_type_name,
          duration_minutes: sch.duration_minutes,
          status: "scheduled",
        }))
    : [];

  const displaySessions = actualTutorSessions.length > 0 ? actualTutorSessions : recurringTutorForDay;

  // 1. Logika Deteksi Sesi Hari Ini untuk HERO CARD
  const todayActualSessions = sessions.filter((s) => s.session_date === todayDateStr);
  const todaySessions: DashboardSession[] =
    todayActualSessions.length > 0
      ? todayActualSessions
      : schedules
          .filter((sch) => sch.day_of_week === new Date().getDay() && sch.status === "active")
          .map((sch) => ({
            id: `today-${sch.id}`,
            session_date: todayDateStr,
            start_time: sch.start_time,
            end_time: sch.end_time,
            students: sch.students,
            student_name: sch.students?.[0]?.name,
            program_name: sch.program_name,
            bimbel_type_name: sch.bimbel_type_name,
            duration_minutes: sch.duration_minutes,
            status: "scheduled",
          }));

  // Cari sesi yang belum presensi (scheduled)
  const pendingSession =
    todaySessions.find((s) => s.status === "scheduled") || todaySessions[0];
  const allTodayCompleted =
    todaySessions.length > 0 && todaySessions.every((s) => s.status === "completed");

  const completedTodayCount = todaySessions.filter((s) => s.status === "completed").length;
  const attendanceRate =
    todaySessions.length > 0
      ? Math.round((completedTodayCount / todaySessions.length) * 100)
      : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Mobile Top Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {greeting}, {tutorName}!
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold"
            >
              <GraduationCap className="w-3 h-3" />
              Mentor Pengajar
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {formatDate(new Date())} · Bimbel Belajarku
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="hidden sm:flex text-xs h-8 gap-1.5 self-start">
          <Link href="/tutor/schedules">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Kalender Lengkap</span>
          </Link>
        </Button>
      </div>

      {/* Banner Peringatan Ganti Password Bawaan */}
      {mustChangePassword && (
        <Alert
          variant="warning"
          className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <AlertTitle className="font-semibold text-sm">
                  Pemberitahuan: Perbarui Kata Sandi
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                Akun Anda masih menggunakan kata sandi bawaan. Segera perbarui kata sandi untuk keamanan portal Anda.
              </AlertDescription>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-600/40 text-xs gap-1.5 h-8 text-amber-950 dark:text-amber-200"
            >
              <Link href="/tutor/profile">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ganti Password</span>
              </Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO ATTENDANCE ACTION CARD (MOBILE-FIRST HIGHLIGHT UNTUK ABSENSI)     */}
      {/* ========================================================================= */}
      {pendingSession ? (
        <Card className="relative overflow-hidden border-2 border-emerald-500/40 shadow-md">
          {/* Aksen visual background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-accent/60 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/10 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-lime-400 to-transparent" />

          <CardContent className="relative p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-60 animate-ping" />
                      <span className="relative inline-block w-2 h-2 rounded-full bg-white" />
                    </span>
                    SIAP PRESENSI HARI INI
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border">
                    {pendingSession.start_time?.slice(0, 5)} - {pendingSession.end_time?.slice(0, 5)} WIB
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight pt-1">
                  {pendingSession.program_name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {pendingSession.bimbel_type_name} ({pendingSession.duration_minutes || 75}m)
                  </span>
                  <span aria-hidden>•</span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {pendingSession.students && pendingSession.students.length > 1
                        ? `${pendingSession.students.length} Siswa (${pendingSession.students.map((s) => s.name).join(", ")})`
                        : pendingSession.student_name || "1 Siswa Privat"}
                    </span>
                  </span>
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  <MapPin className="w-3 h-3" />
                  Ruang A1 Bimbel
                </Badge>
                {/* Progres presensi sesi hari ini */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Progres presensi
                  </span>
                  <div className="flex items-center gap-1">
                    {todaySessions.map((s) => (
                      <span
                        key={s.id}
                        title={s.program_name}
                        className={`size-2.5 rounded-full ${
                          s.status === "completed" ? "bg-emerald-500" : "bg-emerald-500/25 border border-emerald-500/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol CTA Raksasa (Mobile-First Thumb-Friendly) */}
            <Button
              asChild
              className="w-full h-12 sm:h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all gap-2.5"
            >
              <Link href={`/tutor/attendance`}>
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.3]" />
                <span>AMBIL FOTO &amp; INPUT ABSENSI SEKARANG</span>
                <ChevronRight className="w-5 h-5 ml-auto hidden sm:inline" />
              </Link>
            </Button>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                Presensi terbuka sebelum dan sesudah jadwal
              </span>
              <Link href="/tutor/attendance" className="text-primary hover:underline font-medium">
                Pilih sesi lain ({todaySessions.length} Sesi) →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : allTodayCompleted ? (
        <Card className="relative overflow-hidden border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <div className="absolute -top-8 -right-8 size-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <CardContent className="relative p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">
                  Seluruh Sesi Hari Ini Selesai Diabsen!
                </h3>
                <p className="text-xs text-muted-foreground">
                  {completedTodayCount} dari {todaySessions.length} sesi telah tersimpan dengan dokumentasi lengkap.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs shrink-0">
              <Link href="/tutor/attendance">Riwayat</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ========================================================================= */}
      {/* 2. KPI METRICS (RINGKAS & RAMAH MOBILE)                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Card className="shadow-xs p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:flex-col sm:items-stretch">
            <div className="size-8 rounded-lg bg-primary/10 text-primary hidden sm:flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 sm:flex-none text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-tight truncate">
                Sesi Hari Ini
              </p>
              <div className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {todaySessions.length}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground hidden sm:block mt-1">Jadwal mengajar</p>
        </Card>

        <Card className="shadow-xs p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:flex-col sm:items-stretch">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hidden sm:flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 sm:flex-none text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-tight truncate">
                Sudah Diabsen
              </p>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {completedTodayCount}
              </div>
            </div>
          </div>
          {/* Mini progress bar */}
          <div className="mt-2 hidden sm:block">
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{attendanceRate}% sesi tercatat</p>
          </div>
        </Card>

        <Card className="shadow-xs p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:flex-col sm:items-stretch">
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hidden sm:flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div className="flex-1 sm:flex-none text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-tight truncate">
                Estimasi Honor
              </p>
              <div className="text-sm sm:text-xl font-black font-mono text-foreground mt-0.5 truncate">
                {estMonthlyPayroll === null ? "—" : formatCompactIDR(estMonthlyPayroll)}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground hidden sm:block mt-1">
            {estMonthlyPayroll === null ? "Tarif belum diatur manajemen" : "Bulan berjalan"}
          </p>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 2.5 AKSES CEPAT (TILE NAVIGASI MOBILE-FIRST)                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          {
            href: "/tutor/attendance",
            label: "Presensi",
            icon: Camera,
            chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            href: "/tutor/schedules",
            label: "Jadwal",
            icon: CalendarDays,
            chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          },
          {
            href: "/tutor/students",
            label: "Murid",
            icon: Users,
            chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            href: "/tutor/payroll",
            label: "Honor",
            icon: Banknote,
            chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
        ].map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border bg-card shadow-xs hover:border-primary/40 hover:shadow-sm active:scale-95 transition-all"
          >
            <div className={`relative size-10 rounded-xl flex items-center justify-center ${tile.chip} transition-transform group-hover:scale-105`}>
              <tile.icon className="size-5" />
              {tile.href === "/tutor/attendance" && pendingSession && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-card" />
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-foreground tracking-tight">{tile.label}</span>
          </Link>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. AGENDA KELAS & KALENDER MENGAJAR                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kalender Jadwal Tutor */}
        <Card className="lg:col-span-5 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Kalender Mengajar</CardTitle>
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
              Pilih tanggal untuk melihat jadwal mengajar Anda
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
              modifiersClassNames={{
                hasSchedule:
                  "bg-slate-100 dark:bg-slate-800 font-semibold text-foreground rounded-md relative",
              }}
              className="rounded-lg border border-border w-full max-w-sm"
            />
            {/* Keterangan / Legend Warna Kalender */}
            <div className="flex items-center justify-center flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 inline-block" />
                <span className="font-medium text-foreground">Ada Jadwal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-primary inline-block" />
                <span>Dipilih</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agenda Mengajar Hari Terpilih */}
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>Jadwal Mengajar:</span>
                  <span className="text-primary font-bold">
                    {selectedDate ? formatDate(selectedDate) : "Hari Ini"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Daftar sesi bimbingan pada tanggal terpilih
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Link href="/tutor/schedules">
                  <span>Semua</span>
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
                    Tidak Ada Jadwal Mengajar
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Anda tidak memiliki jadwal mengajar pada {selectedDate ? formatDate(selectedDate) : "tanggal ini"}.
                  </p>
                </div>
              </div>
            ) : (
              displaySessions.map((session) => {
                const isCompleted = session.status === "completed";

                return (
                  <div
                    key={session.id}
                    className={`relative p-3.5 sm:p-4 pl-5 rounded-xl border transition-all space-y-3 shadow-xs ${
                      isCompleted
                        ? "bg-card border-border/80 opacity-90"
                        : "bg-card border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-sm"
                    }`}
                  >
                    {/* Rail timeline di sisi kiri */}
                    <span
                      className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
                        isCompleted ? "bg-emerald-500/25" : "bg-gradient-to-b from-emerald-500 to-lime-400"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)} WIB
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-muted/40 text-muted-foreground">
                            {session.bimbel_type_name} ({session.duration_minutes || 60}m)
                          </span>
                          <StatusBadge status={session.status} />
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-foreground">
                          {session.program_name}
                        </h4>

                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          {session.students && session.students.length > 1
                            ? `${session.students.length} Murid: ${session.students.map((s) => s.name).join(", ")}`
                            : session.student_name
                            ? `Murid: ${session.student_name}`
                            : "1 Murid Privat"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3" />
                        Ruang Bimbel
                      </span>

                      <Button
                        asChild
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        className={`h-8 text-xs gap-1.5 ${
                          !isCompleted ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs" : ""
                        }`}
                      >
                        <Link href="/tutor/attendance">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isCompleted ? "Lihat Presensi" : "Absen Sesi"}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
