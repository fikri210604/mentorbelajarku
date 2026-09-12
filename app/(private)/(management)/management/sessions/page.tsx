import SessionListPage from "@/features/management/sessions/components/SessionListPage";
import { getSessions } from "@/features/management/sessions/queries/session.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sesi Belajar | Bimbel Belajarku",
};

export default async function Page() {
  const sessions = await getSessions();
  return <SessionListPage initialSessions={sessions} />;
}
