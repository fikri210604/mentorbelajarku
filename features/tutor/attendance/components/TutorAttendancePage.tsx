"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  AlertCircle,
  Clock,
  Users,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { generateSessionsAction } from "@/features/management/sessions/actions/session.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TutorSessionEarning } from "@/features/tutor/payroll/types";
import { AttendanceForm } from "./AttendanceForm";
import { TutorTeachingHistory } from "./TutorTeachingHistory";

interface TutorAttendancePageProps {
  todaySessions?: any[];
  history?: TutorSessionEarning[];
  tutorName?: string;
}

export default function TutorAttendancePage({
  todaySessions: allSessions = [],
  history = [],
  tutorName = "",
}: TutorAttendancePageProps) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();

  const handleGenerateToday = () => {
    startGenerating(async () => {
      try {
        const res = await generateSessionsAction();
        if (!res.success) {
          toast.error(res.error.message || "Gagal memuat sesi jadwal hari ini.");
          return;
        }
        toast.success(res.message || "Sesi berhasil dimuat!");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat membuat sesi.");
      }
    });
  };

  const [thanksOpen, setThanksOpen] = useState(false);
  // Sesi yang baru saja diabsen di klien (sebelum data server ter-refresh)
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  // Kartu: sesi hari ini + sesi terjadwal yang belum diabsen (tanggal lewat). Sesi batal tidak ditampilkan.
  const todaySessions = allSessions
    .filter((s) => s.status !== "cancelled")
    .filter(
      (s) =>
        s.session_date === today ||
        (s.status === "scheduled" && s.session_date && s.session_date < today)
    )
    .map((s) => (submittedIds.includes(s.id) ? { ...s, status: "completed" } : s))
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const pendingSessions = todaySessions.filter((s) => s.status === "scheduled");
  // Hanya sesi yang belum diabsen yang bisa dipilih; sesi selesai tidak pernah membuka form lagi.
  const selectedSession =
    pendingSessions.find((s) => s.id === selectedId) ?? pendingSessions[0] ?? null;

  const scheduledCount = pendingSessions.length;
  const completedCount = todaySessions.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto">
      {/* Header Presensi Tutor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Presensi & Bukti Sesi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ambil 1x foto sesi belajar bersama murid dan catat materi yang telah disampaikan.
          </p>
        </div>

        {todaySessions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            {scheduledCount > 0 ? (
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs px-2.5 py-0.5">
                {scheduledCount} Sesi Perlu Diabsen
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5">
                Semua Selesai ({completedCount})
              </Badge>
            )}
          </div>
        )}
      </div>

      {todaySessions.length === 0 ? (
        <Card className="border-dashed border-2 shadow-xs">
          <CardContent className="p-8 sm:p-12 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground text-base">Tidak Ada Sesi Hari Ini</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Belum ada sesi pembelajaran yang dibuat untuk hari ini. Anda dapat men-generate sesi langsung dari jadwal rutin aktif Anda.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                onClick={handleGenerateToday}
                disabled={isGenerating}
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memuat Sesi...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Muat Sesi Hari Ini dari Jadwal
                  </>
                )}
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/tutor/schedules">Lihat Jadwal Mengajar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* ========================================================================= */}
          {/* PEMILIH SESI: MOBILE-FIRST INTERACTIVE TOUCH CARDS                       */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Pilih Sesi yang Ingin Diabsen:
              </label>
              <span className="text-[11px] text-muted-foreground">
                {todaySessions.length} sesi hari ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {todaySessions.map((session) => {
                const isSelected = selectedSession?.id === session.id;
                const isCompleted = session.status === "completed";

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedId(session.id)}
                    disabled={isCompleted}
                    aria-disabled={isCompleted}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      isCompleted
                        ? "border-border/60 bg-muted/40 opacity-60 cursor-not-allowed grayscale-[30%]"
                        : isSelected
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500 shadow-sm active:scale-[0.98]"
                        : "border-border bg-card hover:border-emerald-500/40 hover:bg-muted/20 active:scale-[0.98]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)} WIB
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-medium border bg-background/80 text-muted-foreground">
                            {session.bimbel_types?.name || "Reguler"}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-foreground truncate">
                          {session.programs?.name || "Program Bimbel"}
                        </h3>

                        {(session.target_material || session.subject_name) && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                            <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">
                              {session.subject_name ? `${session.subject_name} • ` : ""}
                              {session.target_material || session.topic_title}
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            {session.students && session.students.length > 1
                              ? `${session.students.length} Siswa (${session.students.map((s: any) => s.name).join(", ")})`
                              : session.student_name || "1 Siswa Privat"}
                          </span>
                        </p>
                      </div>

                      {/* Status Pill Badge */}
                      <div className="shrink-0 flex flex-col items-end">
                        {isCompleted ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-0 px-2 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sudah Diabsen</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[10px] gap-1 py-0 px-2 font-bold animate-pulse">
                            <span>Perlu Absen</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 flex items-center justify-center">
                        <span className="sr-only">Sesi aktif dipilih</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORM PRESENSI KAMERA UNTUK SESI TERPILIH                                 */}
          {/* ========================================================================= */}
          {!selectedSession && (
            <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Terima kasih sudah melakukan absensi{tutorName ? `, ${tutorName}` : ""}!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Semua sesi sudah diabsen. Riwayat dan honor mengajar Anda dapat dilihat di bawah.
                </p>
              </CardContent>
            </Card>
          )}
          {selectedSession && (
            <div className="pt-2">
              <AttendanceForm
                key={selectedSession.id}
                onSuccess={({ sessionId }) => {
                  setSubmittedIds((prev) => [...prev, sessionId]);
                  setThanksOpen(true);
                  router.refresh();
                }}
                sessionId={selectedSession.id}
                sessionDetails={{
                  date: selectedSession.session_date || new Date().toISOString().split("T")[0],
                  programName: selectedSession.programs?.name || "Program Bimbel",
                  bimbelTypeName: selectedSession.bimbel_types?.name || "Reguler",
                  duration: selectedSession.bimbel_types?.duration_minutes || 60,
                  tutorName: selectedSession.tutors?.profiles?.full_name || "Tutor Pengajar",
                  startTime: selectedSession.start_time || "16:00",
                  endTime: selectedSession.end_time || "17:15",
                  attendanceDeadline: selectedSession.attendance_deadline || null,
                  allowLateUpload: selectedSession.allow_late_upload ?? false,
                  subjectName: selectedSession.subject_name || "Matematika",
                  targetMaterial: selectedSession.target_material || selectedSession.topic_title || "Bab 1: Bilangan Cacah Besar & Operasi Hitung",
                  topicTitle: selectedSession.topic_title || "",
                  worksheetUrl: selectedSession.worksheet_url || "/samples/worksheets/mtk4_bab1.pdf",
                  worksheetName: selectedSession.worksheet_name || "Lembar Latihan Bilangan Cacah & Hitung Susun.pdf",
                }}
                students={
                  selectedSession.students && selectedSession.students.length > 0
                    ? selectedSession.students
                    : [
                        { id: "std-001", name: "Alghazy Malik", student_code: "STD-2026-001" },
                        { id: "std-002", name: "Najwa Khairunnisa", student_code: "STD-2026-002" },
                        { id: "std-003", name: "Dimas Prasetyo", student_code: "STD-2026-003" },
                      ]
                }
              />
            </div>
          )}
        </div>
      )}

      <TutorTeachingHistory history={history} />

      <AlertDialog open={thanksOpen} onOpenChange={setThanksOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Terima kasih sudah absensi!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Presensi dan foto sesi berhasil disimpan. Sesi ini tercatat di riwayat mengajar dan
              menjadi dasar perhitungan honor Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setThanksOpen(false)}>Tutup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
