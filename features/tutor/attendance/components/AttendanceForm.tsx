'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/shared/camera';
import { submitSessionAttendance } from '@/features/tutor/attendance/actions/attendance.actions';
import { validateAttendanceTimeWindow, AttendanceTimeWindowResult } from '@/lib/utils/attendance-window';
import {
  compressImageFile,
  compressImageDataUrl,
  formatBytes,
} from '@/lib/utils/image-compression';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Upload,
  BookOpen,
  UserCheck,
  Check,
  HelpCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  FileText,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/types/database.types';

interface AttendanceFormProps {
  sessionId: string;
  sessionDetails: {
    date: string;
    programName: string;
    bimbelTypeName: string;
    duration: number;
    tutorName: string;
    startTime?: string;
    endTime?: string;
    attendanceDeadline?: string | null;
    allowLateUpload?: boolean;
    subjectName?: string;
    targetMaterial?: string;
    topicTitle?: string;
    worksheetUrl?: string | null;
    worksheetName?: string | null;
    windowConfig?: {
      openBeforeMinutes?: number;
      closeAfterHours?: number;
      maxDaysAllowed?: number;
      allowBackdate?: boolean;
    };
  };
  students: Array<{
    id: string;
    name: string;
    student_code: string;
    packageName?: string;
    nextMeetingNumber?: number;
    maxMeetings?: number;
  }>;
  /** Dipanggil setelah presensi berhasil tersimpan di server. */
  onSuccess?: (info: { sessionId: string; studentCount: number }) => void;
}

interface StudentAttendanceRow {
  studentId: string;
  name: string;
  studentCode: string;
  packageName: string;
  nextMeetingNumber: number;
  maxMeetings: number;
  /** `unset` = tutor belum memilih status; mencegah asumsi default "hadir". */
  status: AttendanceStatus | 'unset';
  material: string;
  notes: string;
}

const STATUS_OPTIONS = [
  { val: 'present', label: 'Hadir', active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' },
  { val: 'permission', label: 'Izin', active: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700' },
  { val: 'sick', label: 'Sakit', active: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700' },
  { val: 'absent', label: 'Alpa', active: 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700' },
] as const;

const AVATAR_HUES = [152, 82, 200, 30, 260, 330] as const;

export function AttendanceForm({
  sessionId,
  sessionDetails,
  students,
  onSuccess,
}: AttendanceFormProps) {
  const router = useRouter();
  const { isOnline, isPoorConnection } = useNetworkStatus();

  // Wizard Step State: 1: Materi & Worksheet, 2: Foto Sesi, 3: Presensi Murid
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const startTime = sessionDetails.startTime || '16:00';
  const endTime = sessionDetails.endTime || '17:15';

  const windowConfig = {
    openBeforeMinutes: sessionDetails.windowConfig?.openBeforeMinutes ?? 15,
    closeAfterHours: sessionDetails.windowConfig?.closeAfterHours ?? 4,
    maxDaysAllowed: sessionDetails.windowConfig?.maxDaysAllowed ?? 1,
    allowBackdate: sessionDetails.windowConfig?.allowBackdate ?? false,
    sessionDeadlineOverride: sessionDetails.attendanceDeadline,
    sessionAllowLateUpload: sessionDetails.allowLateUpload,
  };

  // 1. Validasi Batas Waktu Absensi Dinamis (Master Config + Sesi Override)
  const [windowInfo, setWindowInfo] = useState<AttendanceTimeWindowResult>(() =>
    validateAttendanceTimeWindow(sessionDetails.date, startTime, windowConfig)
  );

  // Perbarui status waktu setiap menit
  useEffect(() => {
    const timer = setInterval(() => {
      setWindowInfo(validateAttendanceTimeWindow(sessionDetails.date, startTime, windowConfig));
    }, 60000);
    return () => clearInterval(timer);
  }, [sessionDetails.date, startTime, sessionDetails.attendanceDeadline, sessionDetails.allowLateUpload]);

  // 2. State untuk Foto Tunggal Sesi (1x Foto untuk seluruh murid)
  const [sessionPhotoBase64, setSessionPhotoBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<{
    originalSize: string;
    compressedSize: string;
    savingsPercent: number;
  } | null>(null);

  const defaultMaxMeetings = sessionDetails.bimbelTypeName.toLowerCase().includes('intensif') ? 12 : 8;

  // 3. State Presensi Seluruh Murid (Otomatis terisi materi terjadwal dan default Hadir)
  const [studentRows, setStudentRows] = useState<StudentAttendanceRow[]>(() =>
    students.map((st) => {
      const maxMeetings = st.maxMeetings || defaultMaxMeetings;
      const nextMeetingNumber = st.nextMeetingNumber ?? 1;
      const packageName = st.packageName || `Paket ${sessionDetails.bimbelTypeName} (${maxMeetings} Sesi)`;

      const defaultMaterial = sessionDetails.targetMaterial || sessionDetails.topicTitle || '';

      return {
        studentId: st.id,
        name: st.name,
        studentCode: st.student_code,
        packageName,
        nextMeetingNumber,
        maxMeetings,
        status: 'unset' as const,
        material: defaultMaterial,
        notes: '',
      };
    })
  );

  // Sinkronisasi jika prop students berubah
  useEffect(() => {
    const defaultMaterial = sessionDetails.targetMaterial || sessionDetails.topicTitle || '';
    setStudentRows(
      students.map((st) => {
        const maxMeetings = st.maxMeetings || defaultMaxMeetings;
        const nextMeetingNumber = st.nextMeetingNumber ?? 1;
        const packageName = st.packageName || `Paket ${sessionDetails.bimbelTypeName} (${maxMeetings} Sesi)`;

        return {
          studentId: st.id,
          name: st.name,
          studentCode: st.student_code,
          packageName,
          nextMeetingNumber,
          maxMeetings,
          status: 'unset' as const,
          material: defaultMaterial,
          notes: '',
        };
      })
    );
  }, [students, defaultMaxMeetings, sessionDetails.bimbelTypeName, sessionDetails.targetMaterial, sessionDetails.topicTitle]);

  // Bulk Material Helper (Terapkan materi ke semua murid)
  const [commonMaterial, setCommonMaterial] = useState(sessionDetails.targetMaterial || sessionDetails.topicTitle || '');

  const handleApplyCommonMaterial = () => {
    if (!commonMaterial.trim()) return;
    setStudentRows((prev) =>
      prev.map((row) => ({
        ...row,
        material: commonMaterial.trim(),
      }))
    );
  };

  const handleMarkAllPresent = () => {
    setStudentRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: 'present',
      }))
    );
  };

  // State Submit & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const presentCount = studentRows.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;
  const permissionCount = studentRows.filter(
    (r) => r.status === 'permission' || r.status === 'sick'
  ).length;
  const absentCount = studentRows.filter((r) => r.status === 'absent').length;
  const undecidedCount = studentRows.filter((r) => r.status === 'unset').length;

  // Penyelesaian tiap langkah untuk stepper
  const stepsDone = {
    1: true,
    2: !!sessionPhotoBase64,
    3: undecidedCount === 0,
  };

  // Handle Upload Foto via File dengan Kompresi Otomatis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar file yang sama bisa dipilih ulang bila diperlukan
    e.target.value = '';

    // Toleransi ukuran file mentah kamera smartphone hingga 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal adalah 20MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File yang dipilih harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    setIsCompressingPhoto(true);
    setErrorMsg(null);

    try {
      const result = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8,
        maxSizeBytes: 400 * 1024,
        mimeType: 'image/jpeg',
      });

      setSessionPhotoBase64(result.dataUrl);
      setPhotoInfo({
        originalSize: formatBytes(result.originalSizeBytes),
        compressedSize: formatBytes(result.sizeBytes),
        savingsPercent: Math.round(result.compressionRatio * 100),
      });
      setErrorMsg(null);
    } catch (err) {
      console.error('Gagal mengompresi foto:', err);
      setErrorMsg('Gagal memproses dan mengompresi foto. Pastikan format file adalah foto yang sah.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Open Confirmation Dialog
  const handleOpenConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErrorMsg('Koneksi internet Anda terputus (offline). Mohon pastikan sinyal aktif sebelum menyimpan presensi agar foto dan data tidak hilang.');
      return;
    }

    if (isCompressingPhoto) {
      setErrorMsg('Mohon tunggu hingga proses kompresi foto selesai.');
      return;
    }

    if (!windowInfo.isAllowed) {
      setErrorMsg(windowInfo.message);
      return;
    }

    if (studentRows.length === 0) {
      setErrorMsg('Tidak ada murid dalam sesi ini untuk diabsen.');
      return;
    }

    if (!sessionPhotoBase64) {
      setErrorMsg('Foto bukti presensi wajib diambil sebelum menyimpan.');
      return;
    }

    if (studentRows.some((row) => row.status === 'unset')) {
      setErrorMsg('Masih ada murid yang belum dipilih status kehadirannya.');
      return;
    }

    setErrorMsg(null);
    setShowConfirmDialog(true);
  };

  // Execute Submit
  const handleExecuteSubmit = async () => {
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErrorMsg('Koneksi internet Anda terputus (offline). Mohon tunggu hingga sinyal pulih sebelum menyimpan.');
      setShowConfirmDialog(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitSessionAttendance({
        sessionId,
        sessionPhotoBase64: sessionPhotoBase64 ?? '',
        items: studentRows.map((row) => ({
          studentId: row.studentId,
          status: row.status as AttendanceStatus,
          material: row.material.trim() || undefined,
          notes: row.notes.trim() || undefined,
        })),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan absensi.');
        setLoading(false);
        setShowConfirmDialog(false);
        return;
      }

      setShowConfirmDialog(false);
      setLoading(false);
      setSuccessMsg(
        `✓ Presensi ${studentRows.length} murid dan 1 foto dokumentasi berhasil disimpan!`
      );
      onSuccess?.({ sessionId, studentCount: studentRows.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan absensi.';
      setErrorMsg(msg);
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const windowBannerStyle =
    windowInfo.status === 'dispensation_active'
      ? 'bg-purple-500/10 border-purple-300 text-purple-950 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-200'
      : windowInfo.status === 'open'
      ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
      : windowInfo.status === 'too_early'
      ? 'bg-amber-500/10 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
      : 'bg-rose-500/10 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200';

  return (
    <Card className="border shadow-md max-w-3xl mx-auto overflow-hidden">
      {/* ========================================================================= */}
      {/* HEADER INFO SESI                                                          */}
      {/* ========================================================================= */}
      <CardHeader className="space-y-3 pb-4 bg-gradient-to-b from-muted/40 to-transparent border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold">Presensi Sesi Belajar</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {studentRows.length} Siswa
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              {sessionDetails.programName} ({sessionDetails.bimbelTypeName} · {sessionDetails.duration}m) · {sessionDetails.date} ({startTime} - {endTime})
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant="outline" className="text-xs font-semibold bg-background">
              Tutor: {sessionDetails.tutorName}
            </Badge>
          </div>
        </div>

        {/* Banner Jendela Waktu Presensi Dinamis */}
        <div className={cn('p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2', windowBannerStyle)}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">Batas Waktu:</span>
              <span className="text-[11px] font-medium">{windowInfo.message}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE 3-STEP WIZARD STEPPER BAR (MOBILE FRIENDLY)                   */}
        {/* ========================================================================= */}
        <div className="pt-1">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/80">
            {[
              { step: 1 as 1 | 2 | 3, icon: BookOpen, iconClass: 'text-blue-600 dark:text-blue-400', hint: 'Materi & Modul' },
              { step: 2 as 1 | 2 | 3, icon: Camera, iconClass: 'text-emerald-600 dark:text-emerald-400', hint: `Foto Sesi${sessionPhotoBase64 ? ' ✓' : ''}` },
              { step: 3 as 1 | 2 | 3, icon: UserCheck, iconClass: 'text-primary', hint: `Presensi (${undecidedCount === 0 ? 'Siap' : 'Menyusul'})` },
            ].map((st) => {
              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setCurrentStep(st.step)}
                  className={cn(
                    'relative flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all',
                    currentStep === st.step
                      ? 'bg-background text-primary shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <st.icon className={cn('w-3.5 h-3.5 shrink-0', st.iconClass)} />
                  <span className="truncate">{st.hint}</span>
                  {stepsDone[st.step] && st.step !== 1 && (
                    <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                      <Check className="size-2 text-white stroke-[4]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-xs font-medium">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: MATERI KURIKULUM & UNDUH WORKSHEET (PDF)                          */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/20 p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px] px-2.5 py-0.5">
                      {sessionDetails.subjectName || "Mata Pelajaran"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Silabus Terjadwal oleh Manajemen
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 pt-1">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{sessionDetails.targetMaterial || sessionDetails.topicTitle || "Materi Pembelajaran Sesi Ini"}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Materi ini telah disiapkan untuk sesi bimbingan hari ini. Unduh worksheet murid jika ingin mencetak atau menampilkan lembar soal latihan.
                  </p>
                </div>

                {sessionDetails.worksheetUrl && (
                  <div className="shrink-0 flex items-center">
                    <Button
                      type="button"
                      asChild
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5 h-9 px-3.5"
                    >
                      <a
                        href={sessionDetails.worksheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="w-4 h-4" />
                        Unduh Worksheet Siswa (PDF)
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Adjust: Materi Bersama */}
            <div className="p-3.5 rounded-xl border bg-card space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Ringkasan / Catatan Materi Pembelajaran Sesi</span>
              </Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  placeholder="Ketik topik materi yang diajarkan (misal: Latihan Soal Logika & Bangun Datar)..."
                  value={commonMaterial}
                  onChange={(e) => setCommonMaterial(e.target.value)}
                  className="text-xs bg-background h-9"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyCommonMaterial}
                  disabled={!commonMaterial.trim()}
                  className="h-9 text-xs shrink-0 gap-1 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terapkan ke Semua Siswa</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Materi ini otomatis terisi ke catatan pembelajaran seluruh murid di sesi ini.
              </p>
            </div>

            {/* Navigation Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">Langkah 1 dari 3</span>
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>Lanjut: Foto Sesi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: FOTO DOKUMENTASI SESI (CUKUP 1x FOTO)                             */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Dropzone besar untuk foto dokumentasi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Foto Dokumentasi Kelas (1x Foto Saja)</span>
                </Label>
                {isCompressingPhoto && (
                  <span className="text-xs text-muted-foreground">Mengompresi foto...</span>
                )}
              </div>

              {/* Area Kamera Langsung (Webcam) */}
              {showCamera && (
                <div className="p-3 border-2 border-primary/30 rounded-2xl bg-primary/5">
                  <CameraCapture
                    onCapture={async (img) => {
                      setIsCompressingPhoto(true);
                      try {
                        const result = await compressImageDataUrl(img, {
                          maxWidth: 1280,
                          maxHeight: 1280,
                          quality: 0.8,
                          maxSizeBytes: 400 * 1024,
                        });
                        setSessionPhotoBase64(result.dataUrl);
                        setPhotoInfo({
                          originalSize: formatBytes(result.originalSizeBytes),
                          compressedSize: formatBytes(result.sizeBytes),
                          savingsPercent: Math.round(result.compressionRatio * 100),
                        });
                      } catch {
                        setSessionPhotoBase64(img);
                        setPhotoInfo(null);
                      } finally {
                        setIsCompressingPhoto(false);
                      }
                      setShowCamera(false);
                      setErrorMsg(null);
                    }}
                    onCancel={() => setShowCamera(false)}
                  />
                </div>
              )}

              {/* Preview Foto Siap */}
              {sessionPhotoBase64 && !showCamera && (
                <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sessionPhotoBase64}
                    alt="Foto Sesi Kelas"
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                      <Check className="size-3 stroke-[4]" />
                      FOTO SIAP
                    </span>
                    {photoInfo && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-background/90 text-[10px] font-semibold text-foreground shadow-xs">
                        {photoInfo.compressedSize}
                        {photoInfo.savingsPercent > 0 && ` · hemat ${photoInfo.savingsPercent}%`}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-gradient-to-t from-background/95 to-transparent">
                    <p className="text-[11px] font-medium text-foreground px-1">
                      Akan diverifikasi bersama presensi {studentRows.length} siswa.
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCamera(true)}
                        className="h-7 text-xs gap-1 bg-background"
                      >
                        <Camera className="size-3" />
                        Ganti
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSessionPhotoBase64(null);
                          setPhotoInfo(null);
                        }}
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive bg-background"
                      >
                        <Trash2 className="size-3" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dropzone Awal */}
              {!sessionPhotoBase64 && !showCamera && !isCompressingPhoto && (
                <div className="bg-dot-pattern border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center space-y-4">
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse-ring">
                    <Camera className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Ambil foto sesi belajar</p>
                    <p className="text-xs text-muted-foreground">
                      Cukup 1 foto bersama seluruh murid. Otomatis dipakai untuk semua siswa & dikompresi di perangkat.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button type="button" onClick={() => setShowCamera(true)} className="h-9 text-xs font-semibold shadow-xs">
                      <Camera className="size-4" />
                      Buka Kamera
                    </Button>
                    <Label
                      htmlFor="photoUploadInput"
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-background border border-input text-xs font-medium cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Upload className="size-3.5" />
                      Pilih dari Galeri
                    </Label>
                    <input
                      id="photoUploadInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              )}

              {/* Status Sedang Mengompresi */}
              {isCompressingPhoto && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-medium">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Sedang mengompresi dan mengoptimalkan ukuran foto...</span>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="gap-1.5 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali: Materi</span>
              </Button>

              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>Lanjut: Presensi ({studentRows.length} Siswa)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CEKLIST PRESENSI MURID & SUBMIT                                   */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Quick Action & Stat Summary */}
            <div className="p-3 rounded-xl border bg-gradient-to-r from-muted/40 to-transparent space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-foreground">Ringkasan Status:</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    {presentCount} Hadir
                  </Badge>
                  {permissionCount > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      {permissionCount} Izin / Sakit
                    </Badge>
                  )}
                  {absentCount > 0 && (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30">
                      {absentCount} Alpa
                    </Badge>
                  )}
                  {undecidedCount > 0 && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      {undecidedCount} Belum dipilih
                    </Badge>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  className="h-8 text-xs gap-1.5 bg-background font-medium self-start sm:self-auto"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tandai Semua Hadir</span>
                </Button>
              </div>
            </div>

            {/* List Siswa */}
            <div className="space-y-2.5">
              {studentRows.map((row, idx) => {
                const hue = AVATAR_HUES[idx % AVATAR_HUES.length];
                const initial = row.name.charAt(0).toUpperCase();
                return (
                  <div
                    key={row.studentId}
                    className={cn(
                      'p-3.5 sm:p-4 rounded-xl border bg-card space-y-3 transition-colors',
                      row.status === 'unset'
                        ? 'border-border'
                        : 'border-primary/25'
                    )}
                  >
                    {/* Header Murid + Status Toggles */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white shadow-xs"
                          style={{ backgroundColor: `hsl(${hue} 45% 42%)` }}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">{row.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {row.studentCode}
                            </span>
                          </div>

                          {/* Info Kuota & Pertemuan Sesuai Aturan Bisnis */}
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[11px]">
                            {row.status === 'unset' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium text-muted-foreground">
                                <HelpCircle className="size-3" />
                                Tentukan status kehadiran
                              </span>
                            ) : row.status === 'present' || row.status === 'late' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-emerald-700 dark:text-emerald-400">
                                <Sparkles className="size-3" />
                                Dicatat P{row.nextMeetingNumber} (Sesi ke-{row.nextMeetingNumber} dari {row.maxMeetings})
                              </span>
                            ) : row.status === 'permission' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-amber-700 dark:text-amber-400">
                                Izin (Kuota pertemuan aman &amp; tidak berkurang)
                              </span>
                            ) : row.status === 'sick' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-blue-700 dark:text-blue-400">
                                Sakit (Kuota pertemuan aman)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-rose-700 dark:text-rose-400">
                                Alpa (Tidak hadir tanpa konfirmasi)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Status Kehadiran Cepat (Touch Friendly) */}
                      <div className="grid grid-cols-4 sm:flex items-center gap-1 self-stretch sm:self-auto">
                        {STATUS_OPTIONS.map((st) => {
                          const isActive = row.status === st.val;
                          return (
                            <button
                              key={st.val}
                              type="button"
                              onClick={() =>
                                setStudentRows((prev) =>
                                  prev.map((r) =>
                                    r.studentId === row.studentId ? { ...r, status: st.val } : r
                                  )
                                )
                              }
                              className={cn(
                                'h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all active:scale-95',
                                isActive
                                  ? st.active
                                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background'
                              )}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input Materi & Catatan Khusus */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <div className="space-y-1">
                        <Label htmlFor={`mat-${row.studentId}`} className="text-[11px] font-medium text-muted-foreground">
                          Materi Siswa ({row.name})
                        </Label>
                        <Input
                          id={`mat-${row.studentId}`}
                          placeholder="Materi yang dipelajari..."
                          value={row.material}
                          onChange={(e) =>
                            setStudentRows((prev) =>
                              prev.map((r) =>
                                r.studentId === row.studentId ? { ...r, material: e.target.value } : r
                              )
                            )
                          }
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`note-${row.studentId}`} className="text-[11px] font-medium text-muted-foreground">
                          Catatan Tambahan (Opsional)
                        </Label>
                        <Input
                          id={`note-${row.studentId}`}
                          placeholder="Catatan keaktifan, PR, atau kendala..."
                          value={row.notes}
                          onChange={(e) =>
                            setStudentRows((prev) =>
                              prev.map((r) =>
                                r.studentId === row.studentId ? { ...r, notes: e.target.value } : r
                              )
                            )
                          }
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation & Final Submit Trigger */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="gap-1.5 text-xs w-full sm:w-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali: Foto Sesi</span>
              </Button>

              <Button
                type="button"
                onClick={() => handleOpenConfirm()}
                disabled={loading || undecidedCount > 0}
                className="gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto h-10 px-4 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Presensi Sesi ({studentRows.length} Siswa)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI SEBELUM DISIMPAN KE SISTEM                               */}
      {/* ========================================================================= */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <HelpCircle className="w-5 h-5 text-primary" />
              Konfirmasi Simpan Presensi Sesi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Pastikan rincian kehadiran dan materi telah sesuai sebelum disimpan ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="text-xs space-y-2 text-left">
            <div className="p-3 rounded-lg bg-muted/50 border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sesi / Program:</span>
                <span className="font-semibold">{sessionDetails.programName} ({sessionDetails.bimbelTypeName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu:</span>
                <span className="font-mono">{sessionDetails.date} • {startTime} - {endTime} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materi Pokok:</span>
                <span className="font-semibold truncate max-w-[200px]">{commonMaterial || "Materi Kurikulum"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Foto Dokumentasi:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {sessionPhotoBase64 ? '✓ 1 Foto Sesi Terlampir' : '⚠️ Tanpa Foto Dokumentasi'}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Kehadiran Siswa:</span>
                <div className="flex gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{presentCount} Hadir</span>
                  <span>•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium">{permissionCount} Izin/Sakit</span>
                  <span>•</span>
                  <span className="text-rose-700 dark:text-rose-400 font-medium">{absentCount} Alpa</span>
                </div>
              </div>
            </div>

            {isPoorConnection && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Wifi className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="leading-snug">
                  <strong>Perhatian:</strong> Sinyal internet sedang lambat. Unggah foto absensi dan penyimpanan data mungkin memakan waktu lebih lama. Harap jangan menutup browser.
                </span>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-normal">
              Data kehadiran ini akan langsung tercatat ke riwayat pertemuan murid serta diajukan sebagai dasar honor mengajar tutor.
            </p>
          </div>

          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel disabled={loading} className="text-xs">
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSubmit}
              disabled={loading}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ya, Simpan Presensi Sesi
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
