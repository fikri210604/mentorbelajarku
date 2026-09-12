import TutorStudentListPage from "@/features/tutor/students/components/TutorStudentListPage";
import { getStudents } from "@/features/tutor/students/queries/student.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Murid Binaan | Bimbel Belajarku",
};

export default async function Page() {
  const students = await getStudents();
  return <TutorStudentListPage initialStudents={students} />;
}
