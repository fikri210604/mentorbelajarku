import TutorStudentDetailPage from "@/features/tutor/students/components/TutorStudentDetailPage";
import {
  getStudentById,
  getStudentProgressData,
} from "@/features/tutor/students/queries/student.queries";
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
  const student = await getStudentById(studentId);
  const progressData = await getStudentProgressData(studentId);

  return (
    <TutorStudentDetailPage
      student={student}
      activePackage={progressData.activePackage}
      history={progressData.history}
    />
  );
}
