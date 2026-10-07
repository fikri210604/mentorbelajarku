import ScheduleFormPage from "@/features/management/schedules/components/ScheduleFormPage";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import { getStudents } from "@/features/management/students/queries/student.queries";
import { getSubjects, getCurriculumTopics } from "@/features/management/subjects/queries/subject.queries";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Jadwal Baru | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();

  const [tutors, students, pResult, subjects, curriculumTopics] = await Promise.all([
    getTutors(),
    getStudents(),
    supabase.from("programs").select("*").eq("status", "active"),
    getSubjects(),
    getCurriculumTopics(),
  ]);

  return (
    <ScheduleFormPage
      tutors={tutors}
      students={students}
      programs={pResult.data ?? []}
      subjects={subjects}
      curriculumTopics={curriculumTopics}
    />
  );
}
