import SessionDetailPage from "@/features/tutor/sessions/components/SessionDetailPage";
import { getSessionById } from "@/features/tutor/sessions/queries/session.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Sesi Mengajar | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSessionById(sessionId);

  return <SessionDetailPage session={session} isTutor />;
}
