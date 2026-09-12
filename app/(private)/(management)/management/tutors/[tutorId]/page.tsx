import TutorDetailPage from "@/features/management/tutors/components/TutorDetailPage";
import { getTutorById } from "@/features/management/tutors/queries/tutor.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Tutor | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
  const tutor = await getTutorById(tutorId);

  return <TutorDetailPage tutor={tutor} />;
}
