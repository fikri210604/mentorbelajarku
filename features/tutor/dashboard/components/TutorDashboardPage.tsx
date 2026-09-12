"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Camera,
  CalendarDays,
  Coins,
  ArrowRight,
  KeyRound,
  Clock,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  CalendarX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { SYNTHETIC_SESSIONS, type SyntheticSession } from "@/data/sessions";
import { SYNTHETIC_SCHEDULES } from "@/data/schedules";
import { formatDate } from "@/lib/utils";

interface TutorDashboardPageProps {
  mustChangePassword?: boolean;
}

export default function TutorDashboardPage({
  mustChangePassword = false,
}: TutorDashboardPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Helper format YYYY-MM-DD secara waktu lokal
  const getLocalDateStr = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = getLocalDateStr(selectedDate);

  // Helper cek apakah tutor memiliki jadwal pada tanggal tersebut
  const hasScheduleOnDate = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    // 1. Sesi aktual milik tutor ini
    const hasActualSession = SYNTHETIC_SESSIONS.some(
      (s) => s.tutor_id === "tut-001" && s.session_date === dateStr
    );
    if (hasActualSession) return true;
    // 2. Jadwal rutin aktif milik tutor ini
    const dayOfWeek = date.getDay();
    const hasRecurring = SYNTHETIC_SCHEDULES.some(
      (sch) => sch.tutor_id === "tut-001" && sch.day_of_week === dayOfWeek && sch.status === "active"
    );
    return hasRecurring;
  };

  // Sesi tutor aktual pada tanggal yang dipilih
  const actualTutorSessions = SYNTHETIC_SESSIONS.filter(
    (s) => s.tutor_id === "tut-001" && s.session_date === selectedDateStr
  );

  // Jika tidak ada sesi spesifik tanggal, tampilkan dari jadwal rutin aktif
  const recurringTutorForDay: SyntheticSession[] = selectedDate
    ? SYNTHETIC_SCHEDULES.filter(
        (sch) =>
          sch.tutor_id === "tut-001" &&
          sch.day_of_week === selectedDate.getDay() &&
          sch.status === "active"
      ).map((sch) => ({
        id: `rec-tut-${sch.id}-${selectedDateStr}`,
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

  const displaySessions = actualTutorSessions.length > 0 ? actualTutorSessions : recurringTutorForDay;

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
            <BreadcrumbPage>Dashboard Tutor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Dashboard Tutor"
        description="Selamat datang! Kelola presensi kelas, pantau jadwal mengajar, dan estimasi honor Anda."
      >
        <Button asChild size="sm" className="gap-1.5 shadow-xs">
          <Link href="/tutor/schedules">
            <CalendarDays className="w-4 h-4" />
            <span>Kalender Mengajar</span>
          </Link>
        </Button>
      </PageHeader>

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
                  Pemberitahuan Keamanan: Ganti Password Bawaan
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                Akun Anda saat ini masih menggunakan kata sandi default dari Manajemen. Segera perbarui kata sandi Anda demi keamanan data kelas dan honor mengajar.
              </AlertDescription>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-600/40 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-xs gap-1.5 h-8 text-amber-950 dark:text-amber-200"
            >
              <Link href="/tutor/profile">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ganti Password Sekarang</span>
              </Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase">
              Presensi Hari Ini
            </CardTitle>
            <Camera className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-2 text-xs gap-1.5 shadow-xs">
              <Link href="/tutor/attendance">
                <Camera className="w-3.5 h-3.5" />
                <span>Buka Kamera Presensi</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Jadwal Mengajar
            </CardTitle>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Sesi</div>
            <p className="text-xs text-muted-foreground mt-1">Terjadwal hari ini</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Honor Bulan Berjalan
            </CardTitle>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Rp 1.450.000
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimasi dari sesi terverifikasi</p>
          </CardContent>
        </Card>
      </div>

      {/* WIDGET KALENDER & AGENDA MENGAJAR TUTOR */}
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
                  Sesi bimbingan yang perlu Anda ajar dan catat presensinya
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Link href="/tutor/schedules">
                  <span>Lihat Kalender Penuh</span>
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
                    Belum Ada Jadwal Mengajar pada Tanggal Ini
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Anda tidak memiliki jadwal mengajar pada {selectedDate ? formatDate(selectedDate) : "tanggal ini"}. Silakan pilih tanggal lain untuk memeriksa agenda kelas Anda.
                  </p>
                </div>
              </div>
            ) : (
              displaySessions.map((session) => {
                const isIntensive = session.bimbel_type_name?.toLowerCase().includes("intensif");
                const isPrivate = session.bimbel_type_name?.toLowerCase().includes("privat");

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted/15 transition-all space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)} WIB
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
                            {session.bimbel_type_name} ({session.duration_minutes} Menit)
                          </span>
                          <StatusBadge status={session.status} />
                        </div>

                        <h4 className="font-bold text-base text-foreground">
                          {session.program_name}
                        </h4>

                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          {session.students && session.students.length > 1
                            ? `Kelas Kelompok (${session.students.length} Murid): ${session.students.map((s) => s.name).join(", ")}`
                            : session.student_name
                            ? `Murid: ${session.student_name}`
                            : "1 Siswa Privat"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Ruang Utama Bimbel
                      </span>

                      <Button asChild size="sm" className="h-8 text-xs gap-1.5">
                        <Link href="/tutor/attendance">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Input Presensi</span>
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
