import Link from "next/link";
import { ArrowLeft, Edit, BookOpen, Clock, Calendar, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StudentProgressCard } from "@/features/shared/students/components/StudentProgressCard";
import { StudentHistoryList } from "@/features/shared/students/components/StudentHistoryList";
import type { StudentWithPrograms } from "../types";
import type {
  StudentActivePackageProgress,
  StudentMeetingHistoryItem,
} from "@/features/shared/students/types";

interface StudentDetailPageProps {
  student: StudentWithPrograms | null;
  activePackage?: StudentActivePackageProgress | null;
  history?: StudentMeetingHistoryItem[];
}

export default function StudentDetailPage({
  student,
  activePackage = null,
  history = [],
}: StudentDetailPageProps) {
  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Murid tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/management/students">Kembali ke Daftar Murid</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`NIS: ${student.student_code} • Status: ${student.status}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/students">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/management/students/${student.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Murid
          </Link>
        </Button>
      </PageHeader>

      {/* 1. KARTU PROGRES PAKET & PERTEMUAN KE-X */}
      <StudentProgressCard progress={activePackage} />

      {/* 2. GRID INFORMASI PERSONAL & DETAIL PROGRAM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Informasi Murid & Wali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Jenis Kelamin</span>
              <span className="font-medium">
                {student.gender === "male"
                  ? "Laki-laki"
                  : student.gender === "female"
                  ? "Perempuan"
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Sekolah & Jenjang/Kelas</span>
              <span className="font-medium">
                {student.school || "-"} ({student.grade || "-"})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Nama Orang Tua / Wali</span>
              <span className="font-medium">{student.parent_name || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Kontak WhatsApp Wali</span>
              <span className="font-medium">{student.parent_phone || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Alamat Tinggal</span>
              <span className="font-medium">{student.address || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Rincian Paket Terdaftar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.student_programs && student.student_programs.length > 0 ? (
              <div className="space-y-3">
                {student.student_programs.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3.5 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/10"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {sp.programs?.name || "Program"} - {sp.bimbel_types?.name || "Reguler"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Alokasi Paket: <strong>{sp.total_sessions} Pertemuan</strong> • Mulai:{" "}
                        {sp.start_date || "-"}
                      </p>
                    </div>
                    <StatusBadge status={sp.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada paket program aktif.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. RIWAYAT PERTEMUAN KRONOLOGIS DENGAN NOMOR PERTEMUAN & NAMA TUTOR */}
      <StudentHistoryList
        history={history}
        title="Histori Sesi & Log Pertemuan Murid"
        description="Riwayat presensi pertemuan riil. Nomor pertemuan bertambah hanya untuk kehadiran efektif (Hadir/Terlambat)."
      />
    </div>
  );
}
