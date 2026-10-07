import StudentFormPage from "@/features/management/students/components/StudentFormPage";
import { getStudentById } from "@/features/management/students/queries/student.queries";
import { createServerClient } from "@/lib/supabase/server";
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
  const supabase = createServerClient();

  const [student, programsResult] = await Promise.all([
    getStudentById(studentId),
    supabase
      .from("programs")
      .select("id, name, level, status")
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  return (
    <StudentFormPage
      initialData={student}
      programs={programsResult.data ?? []}
      isEdit
    />
  );
}
