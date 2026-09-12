import ScheduleFormPage from "@/features/management/schedules/components/ScheduleFormPage";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import { getStudents } from "@/features/management/students/queries/student.queries";
import { createServerClient } from "@/lib/supabase/server";
import { SYNTHETIC_PROGRAMS } from "@/data/programs";
import { SYNTHETIC_BIMBEL_TYPES } from "@/data/bimbel-types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Jadwal Baru | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();
  const tutors = await getTutors();
  const students = await getStudents();

  let programs: any[] = [];
  let bimbelTypes: any[] = [];

  try {
    const { data: pData } = await supabase.from("programs").select("*").eq("status", "active");
    if (pData && pData.length > 0) programs = pData;

    const { data: bData } = await supabase.from("bimbel_types").select("*").eq("status", "active");
    if (bData && bData.length > 0) bimbelTypes = bData;
  } catch {
    // fallback below
  }

  if (programs.length === 0) {
    programs = SYNTHETIC_PROGRAMS;
  }
  if (bimbelTypes.length === 0) {
    bimbelTypes = SYNTHETIC_BIMBEL_TYPES;
  }

  return (
    <ScheduleFormPage
      tutors={tutors}
      students={students}
      programs={programs}
      bimbelTypes={bimbelTypes}
    />
  );
}
