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
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { createSchedule } from "../actions/schedule.actions";

interface ScheduleFormPageProps {
  tutors?: any[];
  programs?: any[];
  bimbelTypes?: any[];
  students?: any[];
}

export default function ScheduleFormPage({
  tutors = [],
  programs = [],
  bimbelTypes = [],
  students = [],
}: ScheduleFormPageProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Multi-Student Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
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
      dayOfWeek: 1, // Senin
      startTime: "16:00",
      endTime: "17:15",
      studentIds: [],
      status: "active",
    },
  });

  const watchBimbelTypeId = watch("bimbelTypeId");
  const watchStartTime = watch("startTime");

  // Auto-calculate end time when bimbel type or start time changes
  const handleBimbelTypeChange = (bimbelTypeId: string) => {
    setValue("bimbelTypeId", bimbelTypeId);
    const selectedType = bimbelTypes.find((bt) => bt.id === bimbelTypeId);
    const duration = selectedType?.duration_minutes || 75;

    if (watchStartTime && watchStartTime.includes(":")) {
      const [hours, minutes] = watchStartTime.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const totalMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        const formattedEnd = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
        setValue("endTime", formattedEnd);
      }
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
        s.grade?.toLowerCase().includes(q)
    );
  }, [students, studentSearchQuery]);

  // Toggle student selection
  const handleToggleStudent = (id: string) => {
    const next = selectedStudentIds.includes(id)
      ? selectedStudentIds.filter((item) => item !== id)
      : [...selectedStudentIds, id];

    setSelectedStudentIds(next);
    setValue("studentIds", next, { shouldValidate: true });
  };

  // Select all currently filtered students
  const handleSelectAllFiltered = () => {
    const newIds = Array.from(
      new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.id)])
    );
    setSelectedStudentIds(newIds);
    setValue("studentIds", newIds, { shouldValidate: true });
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
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const onSubmit = async (data: ScheduleInput) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await createSchedule(data);
      if (res && !res.success) {
        setSubmitError(res.error || "Gagal membuat jadwal baru.");
        return;
      }
      setSubmitSuccess(
        `✓ Jadwal baru dengan ${data.studentIds.length} murid berhasil disimpan!`
      );
      setTimeout(() => {
        router.push("/management/schedules");
        router.refresh();
      }, 800);
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
            <BreadcrumbLink href="/management/dashboard">Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/schedules">Jadwal Belajar</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Buat Jadwal Baru</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Buat Jadwal Rutin Baru"
        description="Atur jadwal rutin belajar mingguan untuk kelas privat (1 murid) maupun kelompok (multi-murid)."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/schedules">
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
                errors.bimbelTypeId?.message ||
                "Harap periksa kembali kolom formulir yang belum valid."}
            </AlertDescription>
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
                  Pilih 1 murid untuk kelas privat, atau centang beberapa murid untuk kelas kelompok (seperti TKA).
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
                  <Badge variant="outline" className="text-xs text-muted-foreground">
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
                  <span>Daftar Murid Terpilih ({selectedStudentIds.length}):</span>
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
                          <div className="font-semibold text-foreground text-xs">{st.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            NIS: {st.student_code} • {st.school || "-"} ({st.grade || "-"})
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
                <label className="text-xs font-semibold text-foreground">Tutor Pengajar *</label>
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
                  <p className="text-xs text-destructive mt-1">{errors.tutorId.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Program Studi *</label>
                <select
                  {...register("programId")}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="">Pilih Program Studi</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.level ? `(${p.level})` : ""}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <p className="text-xs text-destructive mt-1">{errors.programId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Jenis Bimbel & Durasi *
                </label>
                <select
                  value={watchBimbelTypeId || ""}
                  onChange={(e) => handleBimbelTypeChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="">Pilih Jenis Bimbel</option>
                  {bimbelTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.name} ({bt.duration_minutes} Menit)
                    </option>
                  ))}
                </select>
                {errors.bimbelTypeId && (
                  <p className="text-xs text-destructive mt-1">{errors.bimbelTypeId.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Hari Belajar *</label>
                <select
                  {...register("dayOfWeek", { valueAsNumber: true })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="1">Senin</option>
                  <option value="2">Selasa</option>
                  <option value="3">Rabu</option>
                  <option value="4">Kamis</option>
                  <option value="5">Jumat</option>
                  <option value="6">Sabtu</option>
                  <option value="0">Minggu</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Jam Mulai (HH:mm) *</label>
                <Input
                  {...register("startTime")}
                  placeholder="16:00"
                  className="mt-1 text-xs"
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive mt-1">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Jam Selesai (HH:mm) *</label>
                <Input
                  {...register("endTime")}
                  placeholder="17:15"
                  className="mt-1 text-xs"
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive mt-1">{errors.endTime.message}</p>
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

            <div className="pt-3 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2 text-xs">
                <Save className="w-4 h-4" />
                {isSubmitting
                  ? "Menyimpan..."
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
              Konfirmasi Terbitkan Jadwal Belajar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mohon pastikan detail jadwal belajar yang akan dibuat sudah sesuai sebelum disimpan ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingData && (
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Tutor Pengajar:</span>
                <span className="font-semibold text-foreground">
                  {tutors.find((t) => t.id === pendingData.tutorId)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Program & Jenis Bimbel:</span>
                <span className="font-semibold text-foreground">
                  {programs.find((p) => p.id === pendingData.programId)?.name || "-"} (
                  {bimbelTypes.find((b) => b.id === pendingData.bimbelTypeId)?.name || "-"}
                  )
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-muted">
                <span className="text-muted-foreground">Hari & Waktu:</span>
                <span className="font-semibold text-foreground">
                  {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][pendingData.dayOfWeek]}{" "}
                  ({pendingData.startTime} - {pendingData.endTime} WIB)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Jumlah Murid Terdaftar:</span>
                <span className="font-semibold text-foreground">
                  {pendingData.studentIds.length} Murid{" "}
                  ({pendingData.studentIds.length > 1 ? "Kelas Kelompok" : "Kelas Privat"})
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleExecuteCreate}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Menyimpan..." : "Ya, Simpan Jadwal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
