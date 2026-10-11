import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  ImageOff,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ScheduleWithDetails } from "../types";
import type { TutorScheduleSessionItem } from "../queries/schedule-detail.queries";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface TutorScheduleDetailPageProps {
  schedule: ScheduleWithDetails | null;
  sessions?: TutorScheduleSessionItem[];
  forbidden?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function TutorScheduleDetailPage({
  schedule,
  sessions = [],
  forbidden = false,
}: TutorScheduleDetailPageProps) {
  if (forbidden) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold">Akses Ditolak</h2>
        <p className="text-xs text-muted-foreground">
          Jadwal ini bukan jadwal mengajar Anda atau akun Anda belum dipetakan
          ke profil tutor.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/schedules">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Jadwal Mengajar
          </Link>
        </Button>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Jadwal Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Data jadwal yang Anda tuju mungkin telah dihapus atau bukan jadwal
            Anda.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/schedules">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Jadwal Mengajar
          </Link>
        </Button>
      </div>
    );
  }

  const startTime = schedule.start_time?.slice(0, 5) ?? "-";
  const endTime = schedule.end_time?.slice(0, 5) ?? "-";
  const daysLabel =
    schedule.days_of_week && schedule.days_of_week.length > 0
      ? [...schedule.days_of_week]
          .sort((a, b) => a - b)
          .map((d) => DAYS[d] ?? "-")
          .join(", ")
      : (DAYS[schedule.day_of_week] ?? "-");

  const totalPresent = sessions
    .flatMap((s) => s.attendance ?? [])
    .filter((a) => a.status === "present").length;
  const totalSessions = sessions.length;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title={`Jadwal: ${daysLabel}, ${startTime} - ${endTime} WIB`}
        description={`${schedule.bimbel_types?.name || "Bimbel"} (${schedule.bimbel_types?.duration_minutes || 60}m) • ${schedule.programs?.name || "Program Bimbel"}`}
      >
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href="/tutor/schedules">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-xs border">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm flex items-center gap-2 font-bold">
              <CalendarDays className="w-4 h-4 text-primary" />
              Informasi Waktu & Program
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Hari:</span>
              <span className="font-semibold text-right">{daysLabel}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Jam:</span>
              <span className="font-mono font-bold">
                {startTime} - {endTime} WIB
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Jenis Bimbel:
              </span>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {schedule.bimbel_types?.name} (
                {schedule.bimbel_types?.duration_minutes}m)
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Program:
              </span>
              <span className="font-medium">
                {schedule.programs?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Lokasi:</span>
              <span className="font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {schedule.location || "Ruang Kelas Bimbel"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground font-medium">Status:</span>
              <StatusBadge status={schedule.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm flex items-center gap-2 font-bold">
              <Users className="w-4 h-4 text-primary" />
              Peserta & Ringkasan Absensi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Tutor:</span>
              <span className="font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {schedule.tutors?.profiles?.full_name || "Anda"}
              </span>
            </div>
            <div className="py-1 border-b border-border/50 space-y-1.5">
              <span className="text-muted-foreground font-medium block">
                Peserta Murid:
              </span>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                {schedule.student_names && schedule.student_names.length > 0 ? (
                  <p className="text-[11px] font-medium">
                    {schedule.total_students || schedule.student_names.length}{" "}
                    siswa: {schedule.student_names.join(", ")}
                  </p>
                ) : (
                  <span className="text-muted-foreground">
                    Belum ada murid yang ditugaskan
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                <p className="text-lg font-bold">{totalSessions}</p>
                <p className="text-[11px] text-muted-foreground">
                  Total sesi terlaksana
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                <p className="text-lg font-bold">{totalPresent}</p>
                <p className="text-[11px] text-muted-foreground">
                  Kehadiran (hadir)
                </p>
              </div>
            </div>
            {schedule.notes && (
              <p className="p-2 rounded bg-muted/30 text-muted-foreground italic text-[11px]">
                &ldquo;{schedule.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat sesi + absensi + foto */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm flex items-center gap-2 font-bold">
            <Camera className="w-4 h-4 text-primary" />
            Riwayat Sesi & Bukti Foto Absensi
            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
              {totalSessions} sesi
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold">
                Belum ada sesi dari jadwal ini
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Sesi pembelajaran (session) dibuat dari jadwal rutin ini.
                Setelah sesi diabsen, bukti foto akan tampil di sini.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/tutor/attendance">Buka Halaman Absensi</Link>
              </Button>
            </div>
          ) : (
            sessions.map((session) => {
              const attendances = session.attendance ?? [];
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-2 px-3.5 py-3 bg-muted/40 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-bold">
                        {formatDate(session.session_date)}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {session.start_time?.slice(0, 5)}-
                        {session.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <StatusBadge status={session.status} />
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                      >
                        <Link href={`/tutor/sessions/${session.id}`}>
                          Lihat Sesi
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {attendances.length === 0 ? (
                    <p className="px-3.5 py-4 text-xs text-muted-foreground italic">
                      Belum ada data absensi pada sesi ini.
                      {session.status === "scheduled" && (
                        <>
                          {" "}
                          <Link
                            href="/tutor/attendance"
                            className="underline font-medium not-italic"
                          >
                            Isi absensi sekarang
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {attendances.map((att) => {
                        const material =
                          att.learning_records?.[0]?.material ||
                          att.learning_records?.[0]?.notes ||
                          att.notes;
                        return (
                          <div
                            key={att.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 px-3.5 py-3"
                          >
                            <div className="space-y-1.5 text-xs min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm">
                                  {att.students?.name || "Murid"}
                                </span>
                                <StatusBadge status={att.status} />
                                <StatusBadge status={att.verification_status} />
                              </div>
                              <p className="text-muted-foreground font-mono text-[11px]">
                                {att.students?.student_code || "-"} •{" "}
                                {att.checked_in_at
                                  ? new Date(att.checked_in_at).toLocaleString(
                                      "id-ID",
                                    )
                                  : "belum check-in"}
                              </p>
                              {material && (
                                <p className="text-[11px]">
                                  <span className="text-muted-foreground font-medium">
                                    Materi:{" "}
                                  </span>
                                  {material}
                                </p>
                              )}
                              <Link
                                href={`/tutor/attendance/${att.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline underline-offset-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Buka detail absensi
                              </Link>
                            </div>

                            <div>
                              {att.photo_url ? (
                                <a
                                  href={att.photo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group block overflow-hidden rounded-lg border border-border bg-muted/20"
                                  title="Klik untuk membuka ukuran penuh"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att.photo_url}
                                    alt={`Bukti foto absensi ${att.students?.name || "murid"}`}
                                    loading="lazy"
                                    className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]"
                                  />
                                  <p className="px-2 py-1.5 text-[10px] text-muted-foreground font-mono truncate">
                                    {att.photo_path}
                                  </p>
                                </a>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/20 px-2 py-6 text-center">
                                  <ImageOff className="w-5 h-5 text-muted-foreground/60" />
                                  <p className="text-[11px] text-muted-foreground">
                                    {att.photo_path
                                      ? "Foto tidak dapat dimuat (signed URL kedaluwarsa/tidak ada akses)."
                                      : "Tidak ada foto presensi."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
