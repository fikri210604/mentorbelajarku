import StudentFormPage from "@/features/management/students/components/StudentFormPage";
import { getStudentById } from "@/features/management/students/queries/student.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Murid | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);

  return <StudentFormPage initialData={student} isEdit />;
}
