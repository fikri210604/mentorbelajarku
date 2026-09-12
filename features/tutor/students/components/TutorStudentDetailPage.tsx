import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, UserCheck } from "lucide-react";
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

interface TutorStudentDetailPageProps {
  student: StudentWithPrograms | null;
  activePackage?: StudentActivePackageProgress | null;
  history?: StudentMeetingHistoryItem[];
}

export default function TutorStudentDetailPage({
  student,
  activePackage = null,
  history = [],
}: TutorStudentDetailPageProps) {
  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Murid tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/tutor/students">Kembali ke Daftar Murid</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`NIS: ${student.student_code} • Jenjang: ${student.school || "-"} (${student.grade || "-"})`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/students">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      {/* 1. KARTU PROGRES KUOTA PAKET & PERTEMUAN KE-X */}
      <StudentProgressCard progress={activePackage} />

      {/* 2. PROGRAM BELAJAR AKTIF */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Program Belajar yang Diikuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.student_programs && student.student_programs.length > 0 ? (
            <div className="space-y-2.5">
              {student.student_programs.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/10"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {sp.programs?.name} ({sp.bimbel_types?.name})
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alokasi Paket: <strong>{sp.total_sessions} Sesi</strong> • Mulai:{" "}
                      {sp.start_date || "-"}
                    </p>
                  </div>
                  <StatusBadge status={sp.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada program aktif.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. HISTORI PERTEMUAN LENGKAP DENGAN NAMA TUTOR & NOMOR PERTEMUAN */}
      <StudentHistoryList
        history={history}
        title="Histori Pertemuan Murid"
        description="Catatan materi yang telah dipelajari murid pada setiap pertemuan sebelumnya (termasuk bila diajar tutor lain)."
      />
    </div>
  );
}
