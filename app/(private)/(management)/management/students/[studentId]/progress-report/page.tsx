import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProgressReportsPage, {
  StudentOption,
} from '@/features/management/progress-reports/components/ProgressReportsPage';
import { getStudentById, getStudents } from '@/features/management/students/queries/student.queries';
import { getStudentEvaluationReport } from '@/features/management/progress-reports/queries/evaluation.queries';
import { requireAuthUser } from '@/lib/auth/session';

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  return {
    title: `Laporan Perkembangan - ${student?.name || 'Murid'} | Bimbel Mentorbelajarku`,
    description: `Rekapitulasi materi dan kehadiran sesi belajar untuk ${student?.name || 'murid'}.`,
  };
}

export default async function Page({ params }: PageProps) {
  await requireAuthUser();
  const { studentId } = await params;

  const [student, initialReport, allStudents] = await Promise.all([
    getStudentById(studentId),
    getStudentEvaluationReport(studentId),
    getStudents(),
  ]);

  if (!student) {
    notFound();
  }

  const studentOptions: StudentOption[] = allStudents.map((s) => ({
    id: s.id,
    name: s.name,
    student_code: s.student_code,
    school: s.school ?? undefined,
    grade: s.grade ?? undefined,
  }));

  return (
    <ProgressReportsPage
      students={studentOptions}
      initialSelectedStudentId={studentId}
      initialReport={initialReport}
      backUrl={`/management/students/${studentId}`}
      backLabel={`Kembali ke Profil ${student.name}`}
    />
  );
}
