'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/shared/camera';
import { submitSessionAttendance } from '@/features/management/attendance/actions/attendance.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import type { AttendanceStatus, UserRole } from '@/types/database.types';

interface AttendanceFormProps {
  sessionId: string;
  sessionDetails: {
    date: string;
    programName: string;
    bimbelTypeName: string;
    duration: number;
    tutorName: string;
  };
  students: Array<{
    id: string;
    name: string;
    student_code: string;
  }>;
  currentUser: {
    id: string;
    role: UserRole;
    tutorId: string | null;
  };
}

export function AttendanceForm({
  sessionId,
  sessionDetails,
  students,
  currentUser,
}: AttendanceFormProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [material, setMaterial] = useState('');
  const [notes, setNotes] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg('Pilih murid terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitSessionAttendance(
        {
          sessionId,
          items: [
            {
              studentId: selectedStudentId,
              status,
              material: material || undefined,
              notes: notes || undefined,
              photoBase64: photoBase64 || undefined,
            },
          ],
        },
        currentUser
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan absensi.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Absensi berhasil disimpan dan dicatat!');
      setPhotoBase64(null);
      setMaterial('');
      setNotes('');
      setTimeout(() => {
        router.push('/management/attendance');
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat submit.';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">Input Absensi Sesi</CardTitle>
            <CardDescription className="text-xs mt-1">
              {sessionDetails.programName} ({sessionDetails.bimbelTypeName} - {sessionDetails.duration}m) · {sessionDetails.date}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Tutor: {sessionDetails.tutorName}
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-sm">{successMsg}</AlertDescription>
            </Alert>
          )}

          {/* Student Selector */}
          <div className="space-y-2">
            <Label htmlFor="studentSelect">Pilih Murid</Label>
            <Select
              value={selectedStudentId}
              onValueChange={(val) => setSelectedStudentId(val || '')}
              disabled={loading}
            >
              <SelectTrigger id="studentSelect">
                <SelectValue placeholder="Pilih murid" />
              </SelectTrigger>
              <SelectContent>
                {students.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name} ({st.student_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attendance Status */}
          <div className="space-y-2">
            <Label htmlFor="statusSelect">Status Kehadiran</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus((val as AttendanceStatus) || 'present')}
              disabled={loading}
            >
              <SelectTrigger id="statusSelect">
                <SelectValue placeholder="Pilih status kehadiran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Hadir (Present)</SelectItem>
                <SelectItem value="permission">Izin (Permission - Kuota Tidak Berkurang)</SelectItem>
                <SelectItem value="sick">Sakit (Sick)</SelectItem>
                <SelectItem value="absent">Tanpa Keterangan (Absent)</SelectItem>
                <SelectItem value="late">Terlambat (Late)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Camera Capture Section */}
          <div className="space-y-2">
            <Label>Foto Bukti Kehadiran</Label>
            {showCamera ? (
              <div className="border rounded-lg p-2 bg-muted/20">
                <CameraCapture
                  onCapture={(img) => {
                    setPhotoBase64(img);
                    setShowCamera(false);
                  }}
                  onCancel={() => setShowCamera(false)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {photoBase64 ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoBase64} alt="Bukti Foto" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-muted/40">
                    <Camera className="h-6 w-6 stroke-[1.5]" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                  className="gap-1.5"
                >
                  <Camera className="h-4 w-4" />
                  <span>{photoBase64 ? 'Ganti Foto' : 'Ambil Foto Langsung'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Material */}
          <div className="space-y-2">
            <Label htmlFor="material">Materi Pembelajaran yang Disampaikan</Label>
            <Input
              id="material"
              placeholder="Contoh: Operasi Hitung Aljabar, Rumus Luas Lingkaran"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Pembelajaran / PR Siswa</Label>
            <Textarea
              id="notes"
              placeholder="Catatan perkembangan belajar siswa hari ini..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/management/attendance')}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Simpan Absensi</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
