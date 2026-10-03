import { GlobalLoading } from "@/components/shared/global-loading";

export default function ReportsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Laporan & Rekapitulasi"
      description="Memuat ringkasan data analitik dan pelaporan berkala..."
      columns={6}
      rows={8}
    />
  );
}
