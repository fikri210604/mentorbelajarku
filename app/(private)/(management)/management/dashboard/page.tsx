import ManagementDashboardPage from "@/features/management/dashboard/components/ManagementDashboardPage";
import { getDashboardData } from "@/features/management/dashboard/queries/dashboard.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Management | Bimbel Belajarku",
};

export default async function Page() {
  const [currentUser, dashboardData] = await Promise.all([
    requireAuthUser(),
    getDashboardData(),
  ]);

  return (
    <ManagementDashboardPage
      initialData={dashboardData}
      currentUser={{
        name: currentUser.user.name,
        roleName: currentUser.roleName,
        permissions: currentUser.permissions,
      }}
    />
  );
}
