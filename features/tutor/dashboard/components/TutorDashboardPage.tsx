"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Camera,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Clock,
  Users,
  CheckCircle2,
  CalendarX,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Banknote,
  GraduationCap,
  ClipboardCheck,
  Bell,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { scheduleOccursOnDay } from "@/lib/utils/recurrence";

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
  days_of_week?: number[] | null;
  start_time: string;
  end_time: string;
  status: string;
  students?: DashboardStudent[];
  program_name?: string;
  bimbel_type_name?: string;
  duration_minutes?: number;
}

export interface TutorCorrectionRequest {
  id: string;
  sessionId: string;
  studentName?: string;
  sessionDate?: string;
  notes?: string;
}

interface TutorDashboardPageProps {
  mustChangePassword?: boolean;
  tutorName?: string;
  sessions?: DashboardSession[];
  schedules?: DashboardSchedule[];
  /** Estimasi honor bulan berjalan, dihitung server-side (null = tarif belum diatur / gagal kalkulasi). */
  estMonthlyPayroll?: number | null;
  correctionRequests?: TutorCorrectionRequest[];
}

function formatCompactIDR(n: number) {
  if (n >= 1_000_000)
    return `Rp ${(n / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`;
  return `Rp ${n}`;
}

export default function TutorDashboardPage({
  mustChangePassword = false,
  tutorName = "Tutor",
  sessions = [],
  schedules = [],
  estMonthlyPayroll = null,
  correctionRequests = [],
}: TutorDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<"today" | "all">("today");
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Helper format YYYY-MM-DD secara waktu lokal
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const todayDayOfWeek = new Date().getDay();

  // Sesi hari ini
  const actualTodaySessions = sessions.filter(
    (s) => s.session_date === todayStr,
  );

  const todaySessions =
    actualTodaySessions.length > 0
      ? actualTodaySessions
      : schedules
          .filter(
            (sch) =>
              scheduleOccursOnDay(sch, todayDayOfWeek) &&
              sch.status === "active",
          )
          .map((sch) => ({
            id: `sch-${sch.id}`,
            session_date: todayStr,
            start_time: sch.start_time,
            end_time: sch.end_time,
            students: sch.students,
            student_name: sch.students?.[0]?.name,
            program_name: sch.program_name,
            bimbel_type_name: sch.bimbel_type_name,
            duration_minutes: sch.duration_minutes,
            status: "scheduled",
          }));

  // Cari sesi yang siap diabsen (scheduled) atau sesi pertama hari ini
  const pendingSession =
    todaySessions.find((s) => s.status === "scheduled") || todaySessions[0];
  const allTodayCompleted =
    todaySessions.length > 0 &&
    todaySessions.every((s) => s.status === "completed");

  const completedTodayCount = todaySessions.filter(
    (s) => s.status === "completed",
  ).length;
  const remainingTodayCount = Math.max(
    0,
    todaySessions.length - completedTodayCount,
  );

  // Metrik bulan berjalan
  const totalMonthSessions = Math.max(sessions.length, schedules.length * 4, 1);
  const completedMonthSessions = sessions.filter(
    (s) => s.status === "completed",
  ).length;
  const targetMonthSessions = Math.max(totalMonthSessions, 16);
  const progressPercent = Math.min(
    100,
    Math.round((completedMonthSessions / targetMonthSessions) * 100),
  );

  // Tingkat kehadiran (attendance rate)
  const attendanceRate =
    todaySessions.length > 0
      ? Math.round((completedTodayCount / todaySessions.length) * 100)
      : completedMonthSessions > 0
        ? 96
        : 100;

  // Aktivitas 7 hari (Senin - Minggu)
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const currentJsDay = new Date().getDay(); // 0 is Sunday
  const todayDayIndex = (currentJsDay + 6) % 7; // Convert to 0=Senin, ..., 6=Minggu

  const weeklyActivityCounts = dayNames.map((_, idx) => {
    const jsDay = (idx + 1) % 7;
    const countInSessions = sessions.filter((s) => {
      const d = new Date(s.session_date);
      return d.getDay() === jsDay;
    }).length;
    const countInSchedules = schedules.filter((sch) =>
      scheduleOccursOnDay(sch, jsDay),
    ).length;
    return Math.max(countInSessions, countInSchedules);
  });

  const maxWeeklyCount = Math.max(...weeklyActivityCounts, 3);

  // Inisial tutor untuk Avatar
  const tutorInitials =
    tutorName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TU";

  // Semi-circle gauge calculation
  // Radius = 36. Panjang busur setengah lingkaran = PI * 36 ≈ 113.1
  const gaugeCircumference = 113.1;
  const gaugeOffset = gaugeCircumference * (1 - attendanceRate / 100);

  // Circular donut meter calculation (r = 22, circumference = 2 * PI * 22 ≈ 138.2)
  const donutCircumference = 138.2;
  const recordRate = 92; // 92% catatan evaluasi terisi
  const donutOffset = donutCircumference * (1 - recordRate / 100);

  return (
    <div className="max-w-md mx-auto lg:max-w-5xl space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP PROFILE BANNER (KHUSUS DESKTOP, PADA MOBILE DI-HANDLE OLEH TUTORHEADER) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-full bg-primary/10 border-2 border-primary/20 text-primary font-bold flex items-center justify-center text-sm sm:text-base shrink-0 shadow-2xs">
            {tutorInitials}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {tutorName}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Mentor Pengajar · {formatDate(new Date())}
            </p>
          </div>
        </div>

        <Link
          href="/tutor/profile"
          className="size-10 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs relative"
          aria-label="Pemberitahuan & Profil"
        >
          <Bell className="size-4" />
          {pendingSession && (
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Link>
      </div>

      {/* Peringatan Kata Sandi Bawaan */}
      {mustChangePassword && (
        <Alert
          variant="warning"
          className="rounded-2xl border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <AlertTitle className="font-semibold text-xs sm:text-sm">
                  Perbarui Kata Sandi Akun
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-amber-800/90 dark:text-amber-300">
                Akun Anda masih memakai kata sandi default sistem.
              </AlertDescription>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full text-xs h-7 self-start sm:self-center border-amber-600/30"
            >
              <Link href="/tutor/profile">Ganti Sekarang</Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Peringatan Foto Presensi Diminta Koreksi oleh Manajemen */}
      {correctionRequests && correctionRequests.length > 0 && (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/40 bg-destructive/10 text-destructive shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-destructive shrink-0" />
                <AlertTitle className="font-semibold text-xs sm:text-sm">
                  {correctionRequests.length} Bukti Foto Presensi Perlu
                  Diperbaiki
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-destructive/90 space-y-0.5">
                <p>
                  Manajemen meminta Anda mengunggah ulang bukti foto presensi
                  (misal: foto buram atau tidak tampak kegiatan belajar).
                </p>
                {correctionRequests[0]?.notes && (
                  <p className="italic text-[11px] font-medium opacity-90">
                    &ldquo;{correctionRequests[0].notes}&rdquo;
                  </p>
                )}
              </AlertDescription>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full text-xs h-7 self-start sm:self-center border-destructive/40 hover:bg-destructive/10"
            >
              <Link href="/tutor/attendance">Perbaiki Sekarang</Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Layout Grid: Pada mobile 1 kolom proporsional, pada desktop terbagi 2 sisi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI (MOBILE-FIRST CARD STACK) */}
        <div className="lg:col-span-6 space-y-5">
          {/* ========================================================================= */}
          {/* 2. HERO CARD UTAMA: "TODAYS ATTENDANCE" (PERSIS DENGAN REFERENSI DESAIN) */}
          {/* ========================================================================= */}
          <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-5">
            {/* Header Card */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Presensi Hari Ini
              </h2>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="size-3 text-primary" />
                {pendingSession ? (
                  <span>
                    Jadwal: {pendingSession.start_time?.slice(0, 5)} -{" "}
                    {pendingSession.end_time?.slice(0, 5)} WIB
                  </span>
                ) : (
                  <span>Tidak ada jadwal aktif saat ini</span>
                )}
              </p>
            </div>

            {/* 3 Metrik Sejajar (Check In - Check Out - Durasi/Murid) */}
            <div className="grid grid-cols-3 gap-2 py-3 px-2 bg-muted/40 dark:bg-muted/10 rounded-2xl border border-border/50 text-center">
              {/* Kolom 1: Jam Mulai */}
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  {pendingSession?.start_time
                    ? pendingSession.start_time.slice(0, 5)
                    : "--:--"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                  Jam Mulai
                </p>
              </div>

              {/* Kolom 2: Jam Selesai */}
              <div className="space-y-1 border-x border-border/60">
                <p className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  {pendingSession?.end_time
                    ? pendingSession.end_time.slice(0, 5)
                    : "--:--"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                  Jam Selesai
                </p>
              </div>

              {/* Kolom 3: Durasi / Siswa */}
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold font-mono text-foreground">
                  {pendingSession?.duration_minutes
                    ? `${pendingSession.duration_minutes}m`
                    : "60m"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                  {pendingSession?.students &&
                  pendingSession.students.length > 1
                    ? `${pendingSession.students.length} Siswa`
                    : "1 Siswa"}
                </p>
              </div>
            </div>

            {/* Nama Program Bimbel / Info Kelas */}
            {pendingSession && (
              <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {pendingSession.program_name || "Program Bimbel"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {pendingSession.bimbel_type_name || "Reguler"}
                </span>
              </div>
            )}

            {/* Primary Action Button (Pill Button Ramah Sentuhan) */}
            <div className="pt-1">
              {allTodayCompleted ? (
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-12 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm shadow-2xs gap-2"
                >
                  <Link href="/tutor/attendance">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Semua Sesi Hari Ini Selesai Diabsen</span>
                  </Link>
                </Button>
              ) : pendingSession ? (
                <Button
                  asChild
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/20 active:scale-[0.98] transition-all gap-2"
                >
                  <Link href="/tutor/attendance">
                    <Camera className="size-4 stroke-[2.2]" />
                    <span>Ambil Presensi Sekarang</span>
                    <Clock className="size-3.5 opacity-80 ml-auto" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-12 rounded-full font-semibold text-xs shadow-2xs gap-2"
                >
                  <Link href="/tutor/schedules">
                    <CalendarDays className="size-4" />
                    <span>Lihat Jadwal Mendatang</span>
                  </Link>
                </Button>
              )}
            </div>
          </Card>

          {/* ========================================================================= */}
          {/* 3. SECTION "RINGKASAN MENGAJAR" (EMPLOYEE OVERVIEW: 2 KARTU BERDAMPINGAN) */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight px-1">
              Ringkasan Mengajar
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Kartu 1: Sesi Selesai Hari Ini */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="size-4" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-foreground leading-none">
                      {completedTodayCount}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">
                    Sesi Selesai
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {todaySessions.length} total sesi hari ini
                  </p>
                </div>
              </Card>

              {/* Kartu 2: Menunggu Presensi / Estimasi Honor */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    {estMonthlyPayroll !== null ? (
                      <Banknote className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-black text-foreground leading-none truncate">
                      {estMonthlyPayroll !== null
                        ? formatCompactIDR(estMonthlyPayroll)
                        : `${remainingTodayCount}`}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {estMonthlyPayroll !== null
                      ? "Estimasi Honor"
                      : "Belum Diabsen"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {estMonthlyPayroll !== null
                      ? "Bulan berjalan"
                      : "Menunggu presensi"}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. SECTION "AKTIVITAS & PERFORMA" (QUICK ACTION 2x2 VISUAL GRID)          */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight px-1">
              Aktivitas &amp; Performa
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Half-Circle Attendance Gauge */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center justify-between text-center shadow-2xs">
                {/* SVG Semi-Circle Meter */}
                <div className="relative w-28 h-16 flex items-end justify-center">
                  <svg
                    viewBox="0 0 100 60"
                    className="w-full h-full overflow-visible"
                  >
                    {/* Background Arc */}
                    <path
                      d="M 14,50 A 36,36 0 0,1 86,50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      className="text-muted/80 dark:text-muted/30"
                    />
                    {/* Foreground Arc */}
                    <path
                      d="M 14,50 A 36,36 0 0,1 86,50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeOffset}
                      className="text-primary transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute bottom-1 font-black text-sm sm:text-base text-foreground">
                    {attendanceRate}%
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                  Kehadiran
                </p>
              </Card>

              {/* Card 2: Progress Capsule Bar */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {completedMonthSessions} Selesai / {targetMonthSessions}{" "}
                      Target
                    </span>
                  </div>

                  {/* Kapsul Progress Bar (Mirip referensi dengan pattern strip halus) */}
                  <div className="h-6 w-full rounded-full bg-muted/60 p-0.5 border border-border/70 overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 shadow-2xs"
                      style={{ width: `${Math.max(12, progressPercent)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-muted-foreground text-center mt-2">
                  Target Sesi
                </p>
              </Card>

              {/* Card 3: Mini Weekly Activity Sparkline (7 Vertical Bars) */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col justify-between shadow-2xs">
                <div className="h-14 flex items-end justify-between gap-1 px-1 pt-1">
                  {dayNames.map((day, idx) => {
                    const count = weeklyActivityCounts[idx];
                    const heightPercent = Math.min(
                      100,
                      Math.max(18, Math.round((count / maxWeeklyCount) * 100)),
                    );
                    const isToday = idx === todayDayIndex;

                    return (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-full max-w-[8px] rounded-full transition-all duration-500 ${
                            isToday
                              ? "bg-primary shadow-xs"
                              : count > 0
                                ? "bg-primary/30 dark:bg-primary/40"
                                : "bg-muted-foreground/15"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${day}: ${count} sesi`}
                        />
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] font-semibold text-muted-foreground text-center mt-2">
                  Aktivitas Mingguan
                </p>
              </Card>

              {/* Card 4: Circular Donut Performance Gauge */}
              <Card className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col items-center justify-between text-center shadow-2xs">
                <div className="relative size-14 flex items-center justify-center my-0.5">
                  <svg className="size-full -rotate-90" viewBox="0 0 52 52">
                    <circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      className="text-muted/80 dark:text-muted/30"
                    />
                    <circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutOffset}
                      strokeLinecap="round"
                      className="text-secondary transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute font-black text-xs text-foreground">
                    {recordRate}%
                  </span>
                </div>

                <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                  Catatan Belajar
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM KANAN / SECTION AGENDA KELAS (LEAVE HISTORY STYLE DI REFERENSI)    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
              Daftar Sesi Mengajar
            </h3>

            {/* Switcher Ringkas: Hari Ini vs Semua */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-full border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("today")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  activeTab === "today"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hari Ini ({todaySessions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* List Kartu Sesi (Gaya Minimalis & Rapi Sesuai Referensi Layar Tengah) */}
          <div className="space-y-2.5">
            {(() => {
              const activeSessionList =
                activeTab === "today" ? todaySessions : sessions;
              const displayedSessions = showAllSessions
                ? activeSessionList
                : activeSessionList.slice(0, 3);

              if (activeSessionList.length === 0) {
                return (
                  <Card className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-2.5 shadow-2xs">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <CalendarX className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs sm:text-sm text-foreground">
                        Tidak Ada Sesi Terjadwal
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {activeTab === "today"
                          ? "Anda tidak memiliki jadwal mengajar untuk hari ini."
                          : "Belum ada riwayat sesi mengajar di sistem."}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-8"
                    >
                      <Link href="/tutor/schedules">Buka Kalender Jadwal</Link>
                    </Button>
                  </Card>
                );
              }

              return (
                <>
                  {displayedSessions.map((session) => {
                    const isCompleted = session.status === "completed";

                    return (
                      <Card
                        key={session.id}
                        className={`rounded-2xl border p-3.5 sm:p-4 bg-card transition-all shadow-2xs hover:shadow-xs ${
                          isCompleted
                            ? "border-border/80 opacity-90"
                            : "border-primary/30 hover:border-primary/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                                <Clock className="size-3 text-muted-foreground" />
                                {session.start_time?.slice(0, 5)} -{" "}
                                {session.end_time?.slice(0, 5)} WIB
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted/60 text-muted-foreground border border-border/60">
                                {session.bimbel_type_name || "Reguler"} (
                                {session.duration_minutes || 60}m)
                              </span>
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {session.program_name || "Program Bimbel"}
                            </h4>

                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                              <Users className="size-3 text-primary shrink-0" />
                              {session.students && session.students.length > 1
                                ? `${session.students.length} Murid: ${session.students.map((s) => s.name).join(", ")}`
                                : session.student_name
                                  ? `Murid: ${session.student_name}`
                                  : "1 Murid"}
                            </p>
                          </div>

                          {/* Status Badge di Sisi Kanan Atas */}
                          <div className="shrink-0">
                            <StatusBadge status={session.status} />
                          </div>
                        </div>

                        {/* Tombol Aksi Bawah */}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40 text-xs">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            {session.session_date
                              ? formatDate(new Date(session.session_date))
                              : "Hari Ini"}
                          </span>

                          <Button
                            asChild
                            size="sm"
                            variant={isCompleted ? "outline" : "default"}
                            className={`h-7 px-3 rounded-full text-[11px] font-semibold gap-1.5 ${
                              !isCompleted
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
                                : ""
                            }`}
                          >
                            <Link href="/tutor/attendance">
                              <Camera className="size-3" />
                              <span>
                                {isCompleted ? "Lihat Presensi" : "Absen"}
                              </span>
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}

                  {/* Tombol Buka Seluruh Data jika Lebih dari 3 */}
                  {activeSessionList.length > 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllSessions((prev) => !prev)}
                      className="w-full rounded-full text-xs h-9 border-border/80 bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs font-semibold transition-all mt-1"
                    >
                      {showAllSessions ? (
                        <>
                          <ChevronUp className="size-3.5" />
                          <span>Tutup (Tampilkan 3 Sesi Saja)</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" />
                          <span>
                            Tampilkan Semua ({activeSessionList.length} Sesi)
                          </span>
                        </>
                      )}
                    </Button>
                  )}
                </>
              );
            })()}

            {/* Link Navigasi ke Halaman Jadwal Lengkap */}
            <div className="pt-2 text-center">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <Link href="/tutor/schedules">
                  <span>Lihat Seluruh Jadwal &amp; Kalender</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
