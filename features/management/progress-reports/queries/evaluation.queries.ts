import { cache } from 'react';
import { StudentProgressService } from '@/features/shared/students/services/student-progress.service';
import { getStudentById } from '@/features/management/students/queries/student.queries';
import { EvaluationRowItem } from '../components/PrintableEvaluationSheet';

export function formatIndonesianReportDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = days[d.getDay()];
    const dateNum = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(-2);

    return `${day}, ${dateNum}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export interface StudentEvaluationReportData {
  studentId: string;
  studentName: string;
  studentCode: string;
  programName: string;
  bimbelType: string;
  school: string;
  grade: string;
  rows: EvaluationRowItem[];
}

export const getStudentEvaluationReport = cache(async (studentId: string): Promise<StudentEvaluationReportData> => {
  const [student, progressData] = await Promise.all([
    getStudentById(studentId),
    StudentProgressService.getStudentProgressAndHistory(studentId),
  ]);

  // Urutkan pertemuan dari yang paling awal (Pertemuan ke-1 di atas) sesuai urutan kronologis Google Sheets
  const sortedAscending = [...(progressData.history || [])].sort((a, b) => {
    const timeA = new Date(a.sessionDate).getTime();
    const timeB = new Date(b.sessionDate).getTime();
    return timeA - timeB;
  });

  const rows: EvaluationRowItem[] = sortedAscending.map((item, idx) => ({
    id: item.id,
    dateStr: formatIndonesianReportDate(item.sessionDate),
    material: item.material || 'Materi pembelajaran dan latihan soal',
    meetingNumber: item.meetingNumber || idx + 1,
    tutorName: item.tutorName || 'Tutor Bimbel',
    notes: item.notes || undefined,
  }));

  const activeEnrollment = student?.enrollments?.[0];
  const programName =
    activeEnrollment?.programs?.name ||
    (student as any)?.enrolled_program ||
    progressData.activePackage?.programName ||
    'Reguler Bimbel';
  const bimbelType =
    activeEnrollment?.bimbel_types?.name ||
    (student as any)?.bimbel_type ||
    progressData.activePackage?.bimbelTypeName ||
    'Reguler';

  return {
    studentId,
    studentName: student?.name || 'Affan',
    studentCode: student?.student_code || 'STD-2026-000',
    programName,
    bimbelType,
    school: student?.school || '-',
    grade: student?.grade || '-',
    rows,
  };
});
