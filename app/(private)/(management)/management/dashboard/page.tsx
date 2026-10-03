import ManagementDashboardPage from "@/features/management/dashboard/components/ManagementDashboardPage";
import { getDashboardData } from "@/features/management/dashboard/queries/dashboard.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Management | Bimbel Belajarku",
};

export default async function Page() {
  const dashboardData = await getDashboardData();
  return <ManagementDashboardPage initialData={dashboardData} />;
}
