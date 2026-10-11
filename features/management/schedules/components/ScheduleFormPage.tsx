"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  User,
  Search,
  X,
  Sparkles,
  Clock,
  MapPin,
  Repeat,
  FileText,
  BookOpen,
  BookCheck,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { scheduleSchema, ScheduleInput } from "../schemas/schedule.schema";
import { expandOccurrences } from "@/lib/utils/recurrence";
import { createSchedule, updateScheduleAction } from "../actions/schedule.actions";
import type { ScheduleWithDetails } from "../types";
import type { Subject, CurriculumTopic } from "@/types/subjects";

interface ScheduleFormStudent {
  id: string;
  name?: string | null;
  student_code?: string | null;
  school?: string | null;
  grade?: string | null;
  level?: string | null;
  bimbel_type?: string | null;
  enrollments?: Array<{
    status?: string | null;
    bimbel_types?: {
      id?: string;
      name?: string | null;
      duration_minutes?: number | null;
    } | null;
  }> | null;
}

interface ScheduleTutorOption {
  id: string;
  name?: string | null;
  profiles?: { full_name?: string | null } | null;
}

interface ScheduleProgramOption {
  id: string;
  name?: string | null;
  level?: string | null;
}

interface ScheduleFormPageProps {
  tutors?: ScheduleTutorOption[];
  programs?: ScheduleProgramOption[];
  students?: ScheduleFormStudent[];
  subjects?: Subject[];
  curriculumTopics?: CurriculumTopic[];
  initialSchedule?: ScheduleWithDetails | null;
  mode?: "create" | "edit";
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMinutes = total % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

/** Tanggal hari ini (WIB) format YYYY-MM-DD. */
function todayStrWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Format YYYY-MM-DD menjadi ramah manusia, mis. "Kam, 8 Okt 2026" (tengah hari agar kebal geser zona waktu). */
function formatPreviewDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d, 12, 0, 0));
}

/** Ambil jenis bimbel + durasi utama dari data enrollment murid. */
function resolveStudentBimbel(student?: ScheduleFormStudent) {
  const active =
    student?.enrollments?.find((e) => e.status === "active") ??
    student?.enrollments?.[0] ??
    null;
  const bimbelTypeName =
    active?.bimbel_types?.name || student?.bimbel_type || "—";
  const duration = active?.bimbel_types?.duration_minutes ?? null;
  return { bimbelTypeName, duration };
}

export default function ScheduleFormPage({
  tutors = [],
  programs = [],
  students = [],
  subjects = [],
  curriculumTopics = [],
  initialSchedule = null,
  mode = "create",
}: ScheduleFormPageProps) {
  const router = useRouter();
  const isEditMode = mode === "edit" && Boolean(initialSchedule?.id);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [pastSlotError, setPastSlotError] = useState<string | null>(null);

  // Initial student IDs from initialSchedule
  const initialStudentIds = useMemo(() => {
    if (!initialSchedule?.schedule_students) return [];
    return initialSchedule.schedule_students
      .map((ss) => ss.student_id || ss.students?.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
  }, [initialSchedule]);

  // Initial days of week
  const initialDaysOfWeek = useMemo(() => {
    if (initialSchedule?.days_of_week && initialSchedule.days_of_week.length > 0) {
      return initialSchedule.days_of_week;
    }
    if (typeof initialSchedule?.day_of_week === "number") {
      return [initialSchedule.day_of_week];
    }
    return [new Date().getDay()];
  }, [initialSchedule]);

  // Pengulangan opsional: form recurrence hanya tampil bila dicentang.
  // Tanpa centang = jadwal satu kali pada tanggal yang dipilih.
  const [isRecurring, setIsRecurring] = useState(() => {
    if (!initialSchedule) return false;
    return (
      (initialSchedule.recurrence_count !== null &&
        initialSchedule.recurrence_count !== undefined &&
        initialSchedule.recurrence_count > 1) ||
      Boolean(initialSchedule.recurrence_until) ||
      (Array.isArray(initialSchedule.days_of_week) &&
        initialSchedule.days_of_week.length > 0 &&
        initialSchedule.recurrence_count !== 1)
    );
  });

  // Multi-Student Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialStudentIds);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      tutorId: initialSchedule?.tutor_id || "",
      programId: initialSchedule?.program_id || "",
      startTime: initialSchedule?.start_time ? initialSchedule.start_time.slice(0, 5) : "16:00",
      endTime: initialSchedule?.end_time ? initialSchedule.end_time.slice(0, 5) : "17:15",
      studentIds: initialStudentIds,
      location: initialSchedule?.location || "",
      notes: initialSchedule?.notes || "",
      status: (initialSchedule?.status as "active" | "inactive") || "active",
      subjectId: initialSchedule?.subject_id || "",
      topicId: initialSchedule?.topic_id || "",
      targetMaterial: initialSchedule?.target_material || "",
      worksheetUrl: initialSchedule?.worksheet_url || null,
      recurrence: {
        daysOfWeek: initialDaysOfWeek,
        startDate: initialSchedule?.recurrence_start_date || todayStrWib(),
        intervalWeeks: initialSchedule?.recurrence_interval ?? 1,
        endMode: initialSchedule?.recurrence_until ? "until" : "count",
        count: initialSchedule?.recurrence_count ?? 8,
        until: initialSchedule?.recurrence_until ?? null,
      },
    },
  });

  const watchStartTime = watch("startTime");
  const watchSubjectId = watch("subjectId");
  const watchTopicId = watch("topicId");
  const watchRecurrence = watch("recurrence");

  // Pratinjau tanggal kejadian dari rule pengulangan (client-side, murni).
  // Mode sekali: satu tanggal terpilih.
  // SENGAJA tanpa useMemo: watch("recurrence") mempertahankan identitas referensi
  // objek antar render (RHF memutasi in-place), sehingga memo tak pernah recompute
  // dan pratinjau beku. Komputasi langsung tiap render (ratusan op tanggal, <1ms).
  const recurrencePreview = (() => {
    const r = watchRecurrence;
    if (!isRecurring) {
      if (!r?.startDate) {
        return {
          dates: [] as string[],
          total: 0,
          error: null as string | null,
        };
      }
      return { dates: [r.startDate], total: 1, error: null as string | null };
    }
    try {
      if (!r?.startDate || !r?.daysOfWeek || r.daysOfWeek.length === 0) {
        return {
          dates: [] as string[],
          total: 0,
          error: null as string | null,
        };
      }
      const dates = expandOccurrences({
        startDate: r.startDate,
        daysOfWeek: [...r.daysOfWeek],
        intervalWeeks: r.intervalWeeks ?? 1,
        count: r.endMode === "count" ? (r.count ?? null) : null,
        until: r.endMode === "until" ? (r.until ?? null) : null,
      });
      return { dates, total: dates.length, error: null as string | null };
    } catch (e: unknown) {
      return {
        dates: [] as string[],
        total: 0,
        error:
          e instanceof Error ? e.message : "Aturan pengulangan tidak valid.",
      };
    }
  })();

  // Filter topik bab materi berdasarkan mata pelajaran yang dipilih
  const availableTopics = useMemo(() => {
    if (!watchSubjectId) return [];
    return curriculumTopics.filter((t) => t.subject_id === watchSubjectId);
  }, [curriculumTopics, watchSubjectId]);

  // Topik yang sedang dipilih saat ini
  const selectedTopic = useMemo(() => {
    if (!watchTopicId) return null;
    return curriculumTopics.find((t) => t.id === watchTopicId) || null;
  }, [curriculumTopics, watchTopicId]);

  // Handler pergantian mata pelajaran
  const handleSubjectChange = (subjectId: string) => {
    setValue("subjectId", subjectId);
    setValue("topicId", "");
    setValue("targetMaterial", "");
    setValue("worksheetUrl", "");
  };

  // Handler pergantian bab materi kurikulum
  const handleTopicChange = (topicId: string) => {
    setValue("topicId", topicId);
    const top = curriculumTopics.find((t) => t.id === topicId);
    if (top) {
      const fullTitle = `Bab ${top.chapter_number}: ${top.title}`;
      setValue("targetMaterial", fullTitle);
      setValue("worksheetUrl", top.worksheet_url || null);
    } else {
      setValue("targetMaterial", "");
      setValue("worksheetUrl", null);
    }
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.student_code?.toLowerCase().includes(q) ||
        s.school?.toLowerCase().includes(q) ||
        s.grade?.toLowerCase().includes(q),
    );
  }, [students, studentSearchQuery]);

  // Deteksi data murid terpilih untuk penyaringan mata pelajaran & level
  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Deteksi tingkat/jenjang dari murid terpilih
  const detectedLevels = useMemo(() => {
    const levels = selectedStudents.map((st) => {
      if (st.level) return st.level;
      const g = (st.grade || "").toUpperCase();
      if (g.includes("TK") || g.includes("PAUD") || g.includes("KB"))
        return "TK/PAUD";
      if (
        g.includes("SMP") ||
        g.includes("7") ||
        g.includes("8") ||
        g.includes("9")
      )
        return "SMP";
      if (
        g.includes("SMA") ||
        g.includes("SMK") ||
        g.includes("10") ||
        g.includes("11") ||
        g.includes("12")
      )
        return "SMA";
      if (g.includes("ALUMNI") || g.includes("UTBK")) return "Umum";
      return "SD";
    });
    return Array.from(new Set(levels));
  }, [selectedStudents]);

  // Filter mata pelajaran berdasarkan jenjang murid terpilih
  const filteredSubjects = useMemo(() => {
    if (detectedLevels.length === 1) {
      const targetLevel = detectedLevels[0];
      return subjects.filter(
        (s) => s.level === targetLevel || s.level === "Semua Jenjang",
      );
    }
    return subjects;
  }, [subjects, detectedLevels]);

  // Jenis bimbel & durasi bersumber dari enrollment murid (bukan input jadwal).
  const selectedStudentBimbel = useMemo(
    () =>
      selectedStudents.map((st) => ({
        id: st.id,
        name: st.name || "Murid",
        ...resolveStudentBimbel(st),
      })),
    [selectedStudents],
  );

  const maxSelectedDuration = useMemo(() => {
    const durations = selectedStudentBimbel
      .map((s) => s.duration)
      .filter((d): d is number => typeof d === "number" && d > 0);
    return durations.length > 0 ? Math.max(...durations) : null;
  }, [selectedStudentBimbel]);

  // Recompute end time = jam mulai + durasi tipe terpanjang di antara murid terpilih.
  const syncEndTime = (start: string, ids: string[]) => {
    if (!start || !start.includes(":")) return;
    const durations = ids
      .map(
        (id) =>
          resolveStudentBimbel(students.find((s) => s.id === id)).duration,
      )
      .filter((d): d is number => typeof d === "number" && d > 0);
    if (durations.length === 0) return;
    setValue("endTime", addMinutes(start, Math.max(...durations)), {
      shouldValidate: true,
    });
  };

  const handleStartTimeChange = (val: string) => {
    setPastSlotError(null);
    setValue("startTime", val, { shouldValidate: true });
    const durations = selectedStudentBimbel
      .map((s) => s.duration)
      .filter((d): d is number => typeof d === "number" && d > 0);
    if (durations.length > 0 && val && val.includes(":")) {
      setValue("endTime", addMinutes(val, Math.max(...durations)), {
        shouldValidate: true,
      });
    }
  };

  // Toggle student selection; jam selesai mengikuti durasi tipe terpanjang.
  const handleToggleStudent = (id: string) => {
    const isAdding = !selectedStudentIds.includes(id);
    const next = isAdding
      ? [...selectedStudentIds, id]
      : selectedStudentIds.filter((item) => item !== id);

    setSelectedStudentIds(next);
    setValue("studentIds", next, { shouldValidate: true });
    syncEndTime(watchStartTime, next);
  };

  // Select all currently filtered students
  const handleSelectAllFiltered = () => {
    const newIds = Array.from(
      new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.id)]),
    );
    setSelectedStudentIds(newIds);
    setValue("studentIds", newIds, { shouldValidate: true });
    syncEndTime(watchStartTime, newIds);
  };

  // State Confirm Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ScheduleInput | null>(null);

  // Clear student selection
  const handleClearSelection = () => {
    setSelectedStudentIds([]);
    setValue("studentIds", [], { shouldValidate: true });
  };

  const handlePreSubmit = (data: ScheduleInput) => {
    // Tanpa centang pengulangan: jadikan satu kali pada tanggal terpilih
    // (count=1 pada hari tanggal tersebut) agar kontrak DB tetap terpenuhi.
    let effective = data;
    if (!isRecurring) {
      const [y, m, d] = data.recurrence.startDate.split("-").map(Number);
      const dow = new Date(y, m - 1, d, 12, 0, 0).getDay();
      effective = {
        ...data,
        recurrence: {
          daysOfWeek: [dow],
          startDate: data.recurrence.startDate,
          intervalWeeks: 1,
          endMode: "count",
          count: 1,
          until: null,
        },
      };
    }
    // Validasi bisnis: tanggal mulai tidak boleh di masa lalu (WIB),
    // kecuali saat mengedit jadwal yang sudah ada/berjalan.
    if (!isEditMode && effective.recurrence.startDate < todayStrWib()) {
      setPastSlotError(
        `Tanggal ${isRecurring ? "mulai pengulangan" : "jadwal"} (${effective.recurrence.startDate}) sudah lewat. Pilih tanggal hari ini atau yang akan datang.`,
      );
      return;
    }
    setPastSlotError(null);
    setPendingData(effective);
    setShowConfirmDialog(true);
  };

  const onSubmit = async (data: ScheduleInput) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (isEditMode && initialSchedule?.id) {
        const res = await updateScheduleAction(initialSchedule.id, data);
        if (res && !res.success) {
          setSubmitError(res.error || "Gagal memperbarui jadwal.");
          return;
        }
        setSubmitSuccess(
          res.message || "✓ Perubahan jadwal berhasil disimpan!",
        );
        setTimeout(() => {
          router.push(`/management/schedules/${initialSchedule.id}`);
          router.refresh();
        }, 800);
      } else {
        const res = await createSchedule(data);
        if (res && !res.success) {
          setSubmitError(res.error || "Gagal membuat jadwal baru.");
          return;
        }
        setSubmitSuccess(
          `✓ Jadwal baru dengan ${data.studentIds.length} murid berhasil disimpan!`,
        );
        setTimeout(() => {
          router.push("/management/schedules");
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat menyimpan jadwal.";
      setSubmitError(msg);
      console.error(err);
    }
  };

  const handleExecuteCreate = async () => {
    if (!pendingData) return;
    setShowConfirmDialog(false);
    await onSubmit(pendingData);
  };

  const hasValidationErrors = Object.keys(errors).length > 0;
  const isPrivate = selectedStudentIds.length === 1;
  const isGroup = selectedStudentIds.length > 1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/dashboard">
              Beranda
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/schedules">
              Jadwal Belajar
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {isEditMode && initialSchedule ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/management/schedules/${initialSchedule.id}`}>
                  Detail Jadwal
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Jadwal</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>Buat Jadwal Baru</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={isEditMode ? "Edit Jadwal Rutin" : "Buat Jadwal Rutin Baru"}
        description={
          isEditMode
            ? "Perbarui informasi pengajar, waktu, materi, murid, atau frekuensi jadwal rutin ini."
            : "Atur jadwal rutin belajar mingguan untuk kelas privat (1 murid) maupun kelompok (multi-murid)."
        }
      >
        <Button asChild variant="outline" size="sm">
          <Link href={isEditMode && initialSchedule ? `/management/schedules/${initialSchedule.id}` : "/management/schedules"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Batal
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(handlePreSubmit)} className="space-y-5">
        {/* Banner Alert Validasi Error */}
        {hasValidationErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validasi Formulir Gagal</AlertTitle>
            <AlertDescription>
              {errors.studentIds?.message ||
                errors.tutorId?.message ||
                errors.programId?.message ||
                "Harap periksa kembali kolom formulir yang belum valid."}
            </AlertDescription>
          </Alert>
        )}

        {/* Banner Alert: Slot Waktu Sudah Lewat */}
        {pastSlotError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Jadwal Tidak Dapat Dibuat</AlertTitle>
            <AlertDescription>{pastSlotError}</AlertDescription>
          </Alert>
        )}

        {/* Banner Alert Error Server */}
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal Menyimpan Jadwal</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Banner Alert Sukses */}
        {submitSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle>Berhasil Disimpan</AlertTitle>
            <AlertDescription>{submitSuccess}</AlertDescription>
          </Alert>
        )}

        {/* BAGIAN 1: PEMILIHAN MURID (PRIVAT / MULTI-MURID KELOMPOK) */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Pilih Murid (Mendukung Privat & Kelas Kelompok)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Pilih 1 murid untuk kelas privat, atau centang beberapa murid
                  untuk kelas kelompok (seperti TKA).
                </CardDescription>
              </div>

              {/* Status Tipe Jadwal */}
              <div>
                {isGroup ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold gap-1 text-xs">
                    <Users className="w-3 h-3" />
                    Kelas Kelompok ({selectedStudentIds.length} Murid)
                  </Badge>
                ) : isPrivate ? (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-semibold gap-1 text-xs">
                    <User className="w-3 h-3" />
                    Kelas Privat (1 Murid)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    Belum ada murid dipilih
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {/* Chips Murid Terpilih */}
            {selectedStudentIds.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-lg bg-background border">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>
                    Daftar Murid Terpilih ({selectedStudentIds.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudentIds.map((id) => {
                    const st = students.find((s) => s.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {st?.name || id}
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(id)}
                          className="hover:text-destructive transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Pencarian Murid */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama murid, NIS, jenjang (contoh: Amira, SD, 9 SMP)..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="text-xs h-8 shrink-0"
              >
                Pilih Semua ({filteredStudents.length})
              </Button>
            </div>

            {/* List Pilihan Checkbox Murid */}
            <div className="max-h-56 overflow-y-auto divide-y border rounded-md bg-muted/10 text-xs">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Tidak ada murid yang sesuai dengan pencarian.
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/40 transition-colors ${
                        isChecked ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(st.id)}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <div>
                          <div className="font-semibold text-foreground text-xs">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            NIS: {st.student_code} • {st.school || "-"} (
                            {st.grade || "-"})
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px]">
                        {st.grade || "Siswa"}
                      </Badge>
                    </label>
                  );
                })
              )}
            </div>
            {errors.studentIds && (
              <p className="text-xs text-destructive mt-1 font-medium">
                {errors.studentIds.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* BAGIAN 2: INFORMASI AKADEMIK & WAKTU */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Tutor, Program & Waktu Pembelajaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Tutor Pengajar *
                </label>
                <select
                  {...register("tutorId")}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="">Pilih Tutor Pengajar</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profiles?.full_name || t.id}
                    </option>
                  ))}
                </select>
                {errors.tutorId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.tutorId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Program Bimbel *
                </label>
                <select
                  {...register("programId")}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="">Pilih Program Bimbel</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.level ? `(${p.level})` : ""}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.programId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isRecurring && (
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Hari Belajar *{" "}
                    <span className="font-normal text-muted-foreground">
                      (boleh lebih dari satu)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {DAY_NAMES.map((name, idx) => {
                      const selectedDays = watch("recurrence.daysOfWeek") ?? [];
                      const selected = selectedDays.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const cur = watch("recurrence.daysOfWeek") ?? [];
                            const next = selected
                              ? cur.filter((d) => d !== idx)
                              : [...cur, idx].sort((a, b) => a - b);
                            setValue("recurrence.daysOfWeek", next, {
                              shouldValidate: true,
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {name.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  {errors.recurrence?.daysOfWeek && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.recurrence.daysOfWeek.message}
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-end">
                <div className="w-full rounded-md border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                  Jenis bimbel &amp; durasi otomatis mengikuti data enrollment
                  murid. Jam selesai = jam mulai + durasi tipe terpanjang.
                </div>
              </div>
            </div>

            {/* Pengulangan ala kalender (opsional) */}
            <div className="rounded-md border bg-background p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="size-4 accent-primary"
                />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" /> Ulangi jadwal ini
                  (berulang)
                </span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {isRecurring ? "Mulai Tanggal *" : "Tanggal *"}
                  </label>
                  <input
                    type="date"
                    {...register("recurrence.startDate", {
                      onChange: () => setPastSlotError(null),
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                  />
                  {errors.recurrence?.startDate && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.recurrence.startDate.message}
                    </p>
                  )}
                </div>
              </div>
              {isRecurring && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Interval
                      </label>
                      <select
                        {...register("recurrence.intervalWeeks", {
                          valueAsNumber: true,
                        })}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                      >
                        <option value={1}>Setiap minggu</option>
                        <option value={2}>Tiap 2 minggu</option>
                        <option value={3}>Tiap 3 minggu</option>
                        <option value={4}>Tiap 4 minggu</option>
                      </select>
                      {errors.recurrence?.intervalWeeks && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.recurrence.intervalWeeks.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Berakhir *
                      </label>
                      <select
                        {...register("recurrence.endMode")}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                      >
                        <option value="count">Setelah N kali</option>
                        <option value="until">Sampai tanggal</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watch("recurrence.endMode") === "count" ? (
                      <div>
                        <label className="text-xs font-semibold text-foreground">
                          Ulangi Sebanyak (kali) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={520}
                          {...register("recurrence.count", {
                            valueAsNumber: true,
                          })}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                          placeholder="mis. 8"
                        />
                        {errors.recurrence?.count && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.recurrence.count.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-foreground">
                          Sampai Tanggal *
                        </label>
                        <input
                          type="date"
                          {...register("recurrence.until")}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                        />
                        {errors.recurrence?.until && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.recurrence.until.message}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Pratinjau Sesi
                      </label>
                      <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground min-h-9">
                        {recurrencePreview.error ? (
                          <span className="text-destructive">
                            {recurrencePreview.error}
                          </span>
                        ) : recurrencePreview.total === 0 ? (
                          "Lengkapi hari & tanggal mulai untuk melihat pratinjau."
                        ) : (
                          <span className="block space-y-1.5">
                            <span className="font-semibold text-foreground">
                              {recurrencePreview.total} sesi
                              {isRecurring ? "" : " (sekali)"}
                            </span>
                            <span className="flex flex-wrap gap-1">
                              {recurrencePreview.dates.slice(0, 8).map((dt) => (
                                <span
                                  key={dt}
                                  className="inline-block px-1.5 py-0.5 rounded bg-background border text-[10px] font-medium text-foreground"
                                >
                                  {formatPreviewDate(dt)}
                                </span>
                              ))}
                              {recurrencePreview.total > 8 && (
                                <span className="inline-block px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  +{recurrencePreview.total - 8} lainnya
                                </span>
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {pastSlotError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {pastSlotError}
                </p>
              )}
            </div>

            {/* Rincian jam selesai per murid (dari jenis bimbel masing-masing) */}
            {selectedStudentBimbel.length > 0 && (
              <div className="rounded-md border bg-background p-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Rincian Jam Selesai per Murid
                </p>
                <ul className="divide-y divide-border/60">
                  {selectedStudentBimbel.map((s) => (
                    <li
                      key={s.id}
                      className="py-1.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-foreground truncate">
                        {s.name}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {s.duration ? (
                          <>
                            {s.bimbelTypeName} · {s.duration} menit
                            {watchStartTime
                              ? ` · selesai ${addMinutes(watchStartTime, s.duration)}`
                              : ""}
                          </>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            Jenis bimbel belum diatur · ikut jam sesi (
                            {watch("endTime")})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {selectedStudentBimbel.some((s) => !s.duration) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Sebagian murid belum memiliki jenis bimbel/enrollment. Atur
                    di Data Murid agar jam selesai otomatis presisi.
                  </p>
                )}
                {maxSelectedDuration && watchStartTime && (
                  <p className="text-[11px] text-primary font-medium pt-1">
                    Sesi berakhir{" "}
                    {addMinutes(watchStartTime, maxSelectedDuration)} WIB
                    (durasi terpanjang {maxSelectedDuration} menit). Absensi
                    cukup sekali di jam tersebut.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Jam Mulai *
                </label>
                <div className="mt-1">
                  <TimePicker
                    value={watch("startTime")}
                    onChange={handleStartTimeChange}
                    placeholder="Pilih jam mulai"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Jam Selesai *
                </label>
                <div className="mt-1">
                  <TimePicker
                    value={watch("endTime")}
                    onChange={(val) =>
                      setValue("endTime", val, { shouldValidate: true })
                    }
                    placeholder="Pilih jam selesai"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  Lokasi / Ruang Belajar
                </label>
                <Input
                  {...register("location")}
                  placeholder="Contoh: Ruang A1, Ruang B2"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Catatan Jadwal (Opsional)
                </label>
                <Input
                  {...register("notes")}
                  placeholder="Contoh: TKA 9 SMP B.Ing, SD + Ngaji"
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BAGIAN 3: KURIKULUM & PENUGASAN MATERI BELAJAR (ADMIN SENTRIS) */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Mata Pelajaran & Materi Kurikulum
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Admin menetapkan mata pelajaran dan bab materi agar tutor
                  tidak perlu mengetik manual dan lembar kerja (worksheet) siap
                  diunduh saat kelas.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-xs self-start sm:self-center"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Terpusat oleh Admin
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BookCheck className="w-3.5 h-3.5 text-primary" />
                  Mata Pelajaran
                </label>
                <select
                  value={watchSubjectId || ""}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.level})
                    </option>
                  ))}
                </select>
                {detectedLevels.length === 1 ? (
                  <p className="text-[11px] text-primary font-medium mt-1">
                    ✓ Otomatis disaring untuk jenjang {detectedLevels[0]} sesuai
                    data murid terpilih.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pilih mata pelajaran yang akan diajarkan pada jadwal ini.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                  Bab / Topik Materi Kurikulum
                </label>
                <select
                  value={watchTopicId || ""}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={!watchSubjectId}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background disabled:bg-muted/50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {watchSubjectId
                      ? availableTopics.length > 0
                        ? "-- Pilih Bab Materi --"
                        : "-- Belum ada silabus bab untuk mapel ini --"
                      : "-- Pilih mapel terlebih dahulu --"}
                  </option>
                  {availableTopics.map((top) => (
                    <option key={top.id} value={top.id}>
                      Bab {top.chapter_number}: {top.title} ({top.grade})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Materi akan otomatis terisi pada formulir presensi tutor.
                </p>
              </div>
            </div>

            {/* Preview Bab & Worksheet yang Terpilih */}
            {selectedTopic && (
              <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white text-[10px]">
                        Bab {selectedTopic.chapter_number}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {selectedTopic.title}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedTopic.grade}
                      </Badge>
                    </div>
                    {selectedTopic.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {selectedTopic.description}
                      </p>
                    )}
                  </div>

                  {selectedTopic.worksheet_name && (
                    <div className="shrink-0 text-right">
                      <Badge
                        variant="secondary"
                        className="text-[11px] gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                      >
                        <Download className="w-3 h-3" />
                        Worksheet Tersedia
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px] truncate">
                        {selectedTopic.worksheet_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Materi Kustom / Tambahan Jika Perlu Penyesuaian */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                  Target / Rencana Materi Khusus (Otomatis terisi dari Bab
                  terpilih)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Dapat disesuaikan jika ada catatan tambahan
                </span>
              </label>
              <Input
                {...register("targetMaterial")}
                placeholder="Contoh: Bab 1: Bilangan Cacah Besar & Latihan Soal Evaluasi"
                className="mt-1 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Kemudahan Alur Tutor:</strong> Tutor tidak perlu menebak
                atau mengetik materi dari awal. Ketika sesi dimulai, tutor
                langsung melihat materi ini dan lembar kerja (worksheet) murid
                siap diunduh dengan 1 klik.
              </span>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                {isSubmitting
                  ? "Menyimpan..."
                  : isEditMode
                  ? `Simpan Perubahan Jadwal (${selectedStudentIds.length} Murid)`
                  : `Simpan Jadwal (${selectedStudentIds.length} Murid)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Konfirmasi Pembuatan Jadwal Alert Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {isEditMode
                ? "Konfirmasi Perbarui Jadwal Belajar"
                : "Konfirmasi Terbitkan Jadwal Belajar"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode
                ? "Mohon pastikan perubahan detail jadwal belajar sudah sesuai. Sesi-sesi mendatang yang belum terlaksana akan diselaraskan secara otomatis."
                : "Mohon pastikan detail jadwal belajar yang akan dibuat sudah sesuai sebelum disimpan ke sistem."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingData && (
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Tutor Pengajar:</span>
                <span className="font-semibold text-foreground">
                  {tutors.find((t) => t.id === pendingData.tutorId)?.profiles
                    ?.full_name ||
                    tutors.find((t) => t.id === pendingData.tutorId)?.name ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Program Bimbel:</span>
                <span className="font-semibold text-foreground">
                  {programs.find((p) => p.id === pendingData.programId)?.name ||
                    "-"}
                </span>
              </div>
              {pendingData.studentIds.length > 0 && (
                <div className="py-1 border-b border-muted space-y-1">
                  <span className="text-muted-foreground">
                    Jam selesai per murid:
                  </span>
                  <div className="space-y-0.5">
                    {pendingData.studentIds.map((id) => {
                      const st = students.find((s) => s.id === id);
                      const { bimbelTypeName, duration } =
                        resolveStudentBimbel(st);
                      return (
                        <div key={id} className="flex justify-between gap-3">
                          <span className="font-medium text-foreground truncate">
                            {st?.name || id}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {duration ? (
                              <>
                                {bimbelTypeName} · selesai{" "}
                                {addMinutes(pendingData.startTime, duration)}
                              </>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">
                                Jenis bimbel belum diatur · ikut jam sesi (
                                {pendingData.endTime})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {pendingData.targetMaterial && (
                <div className="flex justify-between py-1 border-b border-muted">
                  <span className="text-muted-foreground">
                    Materi Kurikulum:
                  </span>
                  <span className="font-semibold text-foreground">
                    {pendingData.targetMaterial}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Hari & Waktu:</span>
                <span className="font-semibold text-foreground text-right">
                  {pendingData.recurrence.daysOfWeek
                    .map((d) => DAY_NAMES[d])
                    .join(", ")}{" "}
                  ({pendingData.startTime} - {pendingData.endTime} WIB)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Pengulangan:</span>
                <span className="font-semibold text-foreground text-right">
                  {pendingData.recurrence.endMode === "count" &&
                  pendingData.recurrence.count === 1 ? (
                    `Sekali saja pada ${pendingData.recurrence.startDate}`
                  ) : (
                    <>
                      Mulai {pendingData.recurrence.startDate}
                      {pendingData.recurrence.intervalWeeks > 1 &&
                        ` · tiap ${pendingData.recurrence.intervalWeeks} minggu`}
                      {pendingData.recurrence.endMode === "count"
                        ? ` · ${pendingData.recurrence.count} kali`
                        : ` · sampai ${pendingData.recurrence.until}`}
                      {recurrencePreview.total > 0 &&
                        ` (${recurrencePreview.total} sesi)`}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">
                  Jumlah Murid Terdaftar:
                </span>
                <span className="font-semibold text-foreground">
                  {pendingData.studentIds.length} Murid (
                  {pendingData.studentIds.length > 1
                    ? "Kelas Kelompok"
                    : "Kelas Privat"}
                  )
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleExecuteCreate}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? "Menyimpan..."
                : isEditMode
                ? "Ya, Simpan Perubahan"
                : "Ya, Simpan Jadwal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
