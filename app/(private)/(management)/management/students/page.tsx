import StudentListPage from "@/features/management/students/components/StudentListPage";
import { getStudents } from "@/features/management/students/queries/student.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Murid | Bimbel Belajarku",
};

export default async function Page() {
  const students = await getStudents();
  return <StudentListPage initialStudents={students} />;
}
