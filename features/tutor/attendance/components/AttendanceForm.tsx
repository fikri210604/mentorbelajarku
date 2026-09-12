'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/shared/camera';
import { submitSessionAttendance } from '@/features/tutor/attendance/actions/attendance.actions';
import { validateAttendanceTimeWindow, AttendanceTimeWindowResult } from '@/lib/utils/attendance-window';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Users,
  Sparkles,
  Upload,
  BookOpen,
  UserCheck,
  Check,
  AlertTriangle,
  HelpCircle,
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
import type { AttendanceStatus, UserRole } from '@/types/database.types';

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
  };
  students: Array<{
    id: string;
    name: string;
    student_code: string;
    packageName?: string;
    nextMeetingNumber?: number;
    maxMeetings?: number;
  }>;
  currentUser: {
    id: string;
    role: UserRole;
    tutorId: string | null;
  };
}

interface StudentAttendanceRow {
  studentId: string;
  name: string;
  studentCode: string;
  packageName: string;
  nextMeetingNumber: number;
  maxMeetings: number;
  status: AttendanceStatus;
  material: string;
  notes: string;
}

export function AttendanceForm({
  sessionId,
  sessionDetails,
  students,
  currentUser,
}: AttendanceFormProps) {
  const router = useRouter();

  const startTime = sessionDetails.startTime || '16:00';
  const endTime = sessionDetails.endTime || '17:15';

  // 1. Validasi Batas Waktu Absensi: Dari mulai mengajar (startTime) s/d 2 jam kemudian
  const [windowInfo, setWindowInfo] = useState<AttendanceTimeWindowResult>(() =>
    validateAttendanceTimeWindow(sessionDetails.date, startTime)
  );

  // Mode Uji Coba: Toggle bypass agar tutor tetap bisa mencoba saat jam lokal di luar sesi
  const [allowTimeBypass, setAllowTimeBypass] = useState(true);

  // Perbarui status waktu setiap menit
  useEffect(() => {
    const timer = setInterval(() => {
      setWindowInfo(validateAttendanceTimeWindow(sessionDetails.date, startTime));
    }, 60000);
    return () => clearInterval(timer);
  }, [sessionDetails.date, startTime]);

  // 2. State untuk Foto Tunggal Sesi (1x Foto untuk seluruh murid)
  const [sessionPhotoBase64, setSessionPhotoBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const defaultMaxMeetings = sessionDetails.bimbelTypeName.toLowerCase().includes('intensif') ? 12 : 8;

  // 3. State Presensi Seluruh Murid (Otomatis muncul tanpa perlu input manual satu per satu)
  const [studentRows, setStudentRows] = useState<StudentAttendanceRow[]>(() =>
    students.map((st) => {
      const maxMeetings = st.maxMeetings || defaultMaxMeetings;
      const nextMeetingNumber = st.nextMeetingNumber || (st.id === 'std-001' ? 3 : (st.id === 'std-004' || st.id === 'std-005' ? 2 : 1));
      const packageName = st.packageName || `Paket ${sessionDetails.bimbelTypeName} (${maxMeetings} Sesi)`;

      return {
        studentId: st.id,
        name: st.name,
        studentCode: st.student_code,
        packageName,
        nextMeetingNumber,
        maxMeetings,
        status: 'present' as AttendanceStatus,
        material: '',
        notes: '',
      };
    })
  );

  // Sinkronisasi jika prop students berubah
  useEffect(() => {
    setStudentRows(
      students.map((st) => {
        const maxMeetings = st.maxMeetings || defaultMaxMeetings;
        const nextMeetingNumber = st.nextMeetingNumber || (st.id === 'std-001' ? 3 : (st.id === 'std-004' || st.id === 'std-005' ? 2 : 1));
        const packageName = st.packageName || `Paket ${sessionDetails.bimbelTypeName} (${maxMeetings} Sesi)`;

        return {
          studentId: st.id,
          name: st.name,
          studentCode: st.student_code,
          packageName,
          nextMeetingNumber,
          maxMeetings,
          status: 'present' as AttendanceStatus,
          material: '',
          notes: '',
        };
      })
    );
  }, [students, defaultMaxMeetings, sessionDetails.bimbelTypeName]);

  // Bulk Material Helper (Terapkan materi ke semua murid)
  const [commonMaterial, setCommonMaterial] = useState('');

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

  // Handle Upload Foto via File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSessionPhotoBase64(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Open Confirmation Dialog
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!allowTimeBypass && !windowInfo.isAllowed) {
      setErrorMsg(windowInfo.message);
      return;
    }

    if (studentRows.length === 0) {
      setErrorMsg('Tidak ada murid dalam sesi ini untuk diabsen.');
      return;
    }

    setErrorMsg(null);
    setShowConfirmDialog(true);
  };

  // Execute Submit
  const handleExecuteSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitSessionAttendance(
        {
          sessionId,
          sessionPhotoBase64: sessionPhotoBase64 || undefined,
          allowTimeBypass,
          items: studentRows.map((row) => ({
            studentId: row.studentId,
            status: row.status,
            material: row.material.trim() || undefined,
            notes: row.notes.trim() || undefined,
          })),
        },
        currentUser
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan absensi.');
        setLoading(false);
        setShowConfirmDialog(false);
        return;
      }

      setShowConfirmDialog(false);
      setSuccessMsg(
        `✓ Presensi ${studentRows.length} murid dan 1 foto dokumentasi berhasil disimpan!`
      );

      setTimeout(() => {
        window.location.href = '/tutor/attendance';
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan absensi.';
      setErrorMsg(msg);
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Format Status Badge Color
  const getStatusBadgeClass = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'permission':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'sick':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
      case 'absent':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      case 'late':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
      default:
        return '';
    }
  };

  return (
    <Card className="border shadow-md max-w-3xl mx-auto">
      {/* Header Info Sesi & Jendela Waktu */}
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">Presensi Sesi Pembelajaran</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {studentRows.length} Murid
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              {sessionDetails.programName} ({sessionDetails.bimbelTypeName} · {sessionDetails.duration}m) · {sessionDetails.date}
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant="outline" className="text-xs font-semibold">
              Tutor: {sessionDetails.tutorName}
            </Badge>
          </div>
        </div>

        {/* Banner Jendela Waktu Presensi: Jam Mengajar s/d 2 Jam Kemudian */}
        <div
          className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            windowInfo.status === 'open'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : windowInfo.status === 'too_early'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
              : 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold">Aturan Waktu Presensi: </span>
              <span>
                Mulai jam mengajar <strong>({startTime})</strong> hingga 2 jam kemudian <strong>({windowInfo.windowEnd})</strong>.
              </span>
              <div className="text-[11px] opacity-90 mt-0.5">{windowInfo.message}</div>
            </div>
          </div>

          {/* Toggle Bypass untuk Mode Coba-Coba */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] bg-background/80 px-2 py-1 rounded border shrink-0">
            <input
              type="checkbox"
              checked={allowTimeBypass}
              onChange={(e) => setAllowTimeBypass(e.target.checked)}
              className="rounded text-primary"
            />
            <span className="font-medium">Bypass Waktu (Uji Coba)</span>
          </label>
        </div>
      </CardHeader>

      <form onSubmit={handleOpenConfirm}>
        <CardContent className="space-y-6">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-sm">{successMsg}</AlertDescription>
            </Alert>
          )}

          {/* =========================================================================
              BAGIAN 1: FOTO DOKUMENTASI SESI (1x FOTO UNTUK SELURUH MURID)
             ========================================================================= */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Foto Dokumentasi Sesi (Cukup 1x Foto)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Foto ini akan otomatis disimpan 1x dan masuk ke data presensi seluruh murid di bawah dengan foto yang sama.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(!showCamera)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{showCamera ? 'Tutup Kamera' : sessionPhotoBase64 ? 'Ambil Ulang' : 'Buka Kamera'}</span>
                </Button>

                <Label
                  htmlFor="photoUploadInput"
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Foto</span>
                </Label>
                <input
                  id="photoUploadInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Area Kamera Langsung (Webcam) */}
            {showCamera && (
              <div className="p-3 border rounded-lg bg-card shadow-inner">
                <CameraCapture
                  onCapture={(img) => {
                    setSessionPhotoBase64(img);
                    setShowCamera(false);
                    setErrorMsg(null);
                  }}
                  onCancel={() => setShowCamera(false)}
                />
              </div>
            )}

            {/* Preview Foto */}
            {sessionPhotoBase64 && !showCamera && (
              <div className="flex items-center gap-3 p-2 rounded-lg border bg-background">
                <div className="relative h-16 w-24 rounded-md overflow-hidden border shrink-0 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sessionPhotoBase64}
                    alt="Foto Sesi Bersama"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Foto dokumentasi berhasil diambil!
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Foto ini akan otomatis digunakan untuk seluruh {studentRows.length} murid pada sesi ini.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSessionPhotoBase64(null)}
                  className="text-xs text-destructive hover:text-destructive h-7"
                >
                  Hapus Foto
                </Button>
              </div>
            )}
          </div>

          {/* =========================================================================
              BAGIAN 2: PRESENSI & MATERI BELAJAR MASING-MASING MURID
             ========================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Daftar Presensi & Materi Belajar Murid</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Semua murid sesi otomatis keluar di bawah. Masukkan status kehadiran & materi pembelajaran masing-masing.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="h-7 text-xs gap-1 self-start sm:self-auto"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Tandai Semua Hadir</span>
              </Button>
            </div>

            {/* Quick Helper: Terapkan Materi Bersama */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg border bg-muted/30 text-xs">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Input
                placeholder="Ketik materi bersama (misal: Latihan Soal Logika & Bangun Datar)..."
                value={commonMaterial}
                onChange={(e) => setCommonMaterial(e.target.value)}
                className="h-8 text-xs flex-1 bg-background"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleApplyCommonMaterial}
                disabled={!commonMaterial.trim()}
                className="h-8 text-xs shrink-0 gap-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Terapkan ke Semua Murid</span>
              </Button>
            </div>

            {/* List Kartu Presensi & Materi Murid */}
            <div className="space-y-3">
              {studentRows.map((row, idx) => (
                <Card key={row.studentId} className="border shadow-none hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    {/* Baris Identitas Murid & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm leading-none">{row.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({row.studentCode})
                            </span>
                          </div>

                          {/* Live Context Nomor Pertemuan Sesuai Aturan Bisnis */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {row.status === 'present' || row.status === 'late' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                <Sparkles className="h-3 w-3 text-emerald-600" />
                                Dicatat sbg P{row.nextMeetingNumber} (Pertemuan {row.nextMeetingNumber}) dari {row.maxMeetings}
                              </span>
                            ) : row.status === 'permission' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                Izin (Kuota pertemuan utuh & tidak berkurang)
                              </span>
                            ) : row.status === 'sick' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                                Sakit (Kuota pertemuan utuh & tidak berkurang)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                                Alpa (Ketidakhadiran tanpa izin)
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              • {row.packageName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pill Selector Status Kehadiran */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            { val: 'present', label: 'Hadir' },
                            { val: 'permission', label: 'Izin' },
                            { val: 'sick', label: 'Sakit' },
                            { val: 'absent', label: 'Alpa' },
                          ] as const
                        ).map((st) => {
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
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                isActive
                                  ? getStatusBadgeClass(st.val) + ' shadow-xs font-semibold'
                                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input Materi & Catatan Murid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor={`mat-${row.studentId}`} className="text-xs font-medium">
                          Materi Pembelajaran ({row.name})
                        </Label>
                        <Input
                          id={`mat-${row.studentId}`}
                          placeholder="Materi yang dipelajari murid ini..."
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
                        <Label htmlFor={`note-${row.studentId}`} className="text-xs font-medium text-muted-foreground">
                          Catatan / Evaluasi (Opsional)
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-4 bg-muted/10">
          <div className="text-xs text-muted-foreground">
            Presensi untuk <strong>{studentRows.length} murid</strong> akan disimpan sekaligus dengan{' '}
            <strong>1 foto dokumentasi sesi</strong> yang sama.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/tutor/attendance')}
              disabled={loading}
              className="text-xs flex-1 sm:flex-initial"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 text-xs flex-1 sm:flex-initial"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Presensi Seluruh Murid</span>
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>

      {/* MODAL KONFIRMASI VALIDASI PRESENSI DENGAN ALERT-DIALOG */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <HelpCircle className="w-5 h-5 text-primary" />
              Konfirmasi Simpan Presensi Sesi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 text-left pt-2">
              <span className="block text-foreground font-medium">
                Anda akan menyimpan rekaman presensi berikut:
              </span>
              <div className="p-2.5 rounded-md bg-muted/40 border space-y-1 text-xs">
                <div>
                  <strong>Sesi:</strong> {sessionDetails.programName} ({sessionDetails.bimbelTypeName})
                </div>
                <div>
                  <strong>Waktu:</strong> {sessionDetails.date} • {startTime} - {endTime}
                </div>
                <div>
                  <strong>Total Murid:</strong> {studentRows.length} Orang
                </div>
                <div className="flex gap-2 text-[11px] pt-1">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {presentCount} Hadir
                  </span>
                  <span>•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {permissionCount} Izin/Sakit
                  </span>
                  <span>•</span>
                  <span className="text-rose-700 dark:text-rose-400 font-medium">
                    {absentCount} Alpa
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground pt-1">
                  Foto Sesi: {sessionPhotoBase64 ? '✓ 1 Foto dokumentasi terlampir' : '⚠️ Tanpa foto dokumentasi'}
                </div>
              </div>
              <span className="block text-muted-foreground text-[11px] pt-1">
                Data kehadiran akan langsung menjadi dasar perhitungan kuota pertemuan murid dan pengajuan honor mengajar ke Manajemen. Lanjutkan penyimpanan?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel disabled={loading} className="text-xs">
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSubmit}
              disabled={loading}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ya, Simpan Presensi
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

