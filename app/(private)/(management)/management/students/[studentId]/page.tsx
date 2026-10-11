import StudentDetailPage from "@/features/management/students/components/StudentDetailPage";
import {
  getStudentById,
  getStudentProgressData,
} from "@/features/management/students/queries/student.queries";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Murid | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const [student, progressData, tutors] = await Promise.all([
    getStudentById(studentId),
    getStudentProgressData(studentId),
    getTutors(),
  ]);

  return (
    <StudentDetailPage
      student={student}
      activePackage={progressData.activePackage}
      history={progressData.history}
      tutors={tutors}
    />
  );
}

