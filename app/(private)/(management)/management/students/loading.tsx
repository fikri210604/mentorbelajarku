import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function StudentsLoading() {
  return (
    <TableSkeleton
      title="Data Murid"
      description="Kelola data murid, riwayat paket belajar, dan penugasan kelas."
      columns={6}
      rows={8}
    />
  );
}
