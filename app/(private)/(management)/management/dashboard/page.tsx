import ManagementDashboardPage from "@/features/management/dashboard/components/ManagementDashboardPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Management | Bimbel Belajarku",
};

export default function Page() {
  return <ManagementDashboardPage />;
}
