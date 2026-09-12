import TutorDashboardPage from "@/features/tutor/dashboard/components/TutorDashboardPage";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Tutor | Bimbel Belajarku",
};

export default async function Page() {
  const session = await requireAuthUser();

  return (
    <TutorDashboardPage
      mustChangePassword={session.profile?.must_change_password ?? false}
    />
  );
}
