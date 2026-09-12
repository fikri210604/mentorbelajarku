import TutorListPage from "@/features/management/tutors/components/TutorListPage";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Tutor | Bimbel Belajarku",
};

export default async function Page() {
  const tutors = await getTutors();
  return <TutorListPage initialTutors={tutors} />;
}
