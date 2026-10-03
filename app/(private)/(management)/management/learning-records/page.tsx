import LearningRecordsPage from "@/features/management/learning-records/components/LearningRecordsPage";
import { getLearningRecords } from "@/features/shared/learning-records/queries/learning-record.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catatan Pembelajaran Murid | Bimbel Belajarku",
};

export default async function Page() {
  await requireAuthUser();
  const records = await getLearningRecords();
  return <LearningRecordsPage initialRecords={records} />;
}
