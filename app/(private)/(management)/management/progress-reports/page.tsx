import { Metadata } from 'next';
import ProgressReportsPage, {
  StudentOption,
} from '@/features/management/progress-reports/components/ProgressReportsPage';
import { getStudents } from '@/features/management/students/queries/student.queries';
import { getStudentEvaluationReport } from '@/features/management/progress-reports/queries/evaluation.queries';
import { requireAuthUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Laporan Perkembangan Murid | Bimbel Mentorbelajarku',
  description: 'Rekapitulasi riwayat materi dan kehadiran pembelajaran murid untuk evaluasi dan ekspor PDF resmi.',
};

interface PageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  await requireAuthUser();

  const [params, students] = await Promise.all([
    searchParams,
    getStudents(),
  ]);

  // Cari murid terpilih: utamakan query param ?studentId=, jika tidak ada cari 'std-affan' atau murid pertama
  let selectedStudentId = params.studentId || '';
  if (!selectedStudentId || !students.some((s) => s.id === selectedStudentId)) {
    const affanStudent = students.find(
      (s) => s.id === 'std-affan' || s.student_code === 'STD-2026-000' || s.name.toLowerCase() === 'affan'
    );
    selectedStudentId = affanStudent ? affanStudent.id : students[0]?.id || 'std-affan';
  }

  // Ambil data evaluasi dan rekapitulasi sesi murid tersebut
  const initialReport = await getStudentEvaluationReport(selectedStudentId);

  const studentOptions: StudentOption[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    student_code: s.student_code,
    school: s.school ?? undefined,
    grade: s.grade ?? undefined,
  }));

  return (
    <ProgressReportsPage
      students={studentOptions}
      initialSelectedStudentId={selectedStudentId}
      initialReport={initialReport}
    />
  );
}
