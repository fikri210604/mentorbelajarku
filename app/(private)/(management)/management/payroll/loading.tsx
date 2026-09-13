import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function PayrollLoading() {
  return (
    <TableSkeleton
      title="Honor & Payroll Tutor"
      description="Kalkulasi otomatis honor mengajar berdasarkan kehadiran dan rate terkonfigurasi."
      columns={6}
      rows={8}
    />
  );
}
