export { TableSkeleton, GlobalLoading } from "@/components/shared/global-loading";
export default function LegacyTableSkeleton(props: any) {
  const { TableSkeleton } = require("@/components/shared/global-loading");
  return <TableSkeleton {...props} />;
}
