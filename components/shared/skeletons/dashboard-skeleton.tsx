export { DashboardSkeleton, GlobalLoading } from "@/components/shared/global-loading";
export default function LegacyDashboardSkeleton(props: any) {
  const { DashboardSkeleton } = require("@/components/shared/global-loading");
  return <DashboardSkeleton {...props} />;
}
