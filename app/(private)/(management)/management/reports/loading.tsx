import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function ReportsLoading() {
  return (
    <TableSkeleton
      title="Laporan & Rekapitulasi"
      description="Memuat ringkasan data analitik dan pelaporan berkala..."
      columns={6}
      rows={8}
    />
  );
}
