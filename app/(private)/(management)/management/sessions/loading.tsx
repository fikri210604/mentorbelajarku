import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function SessionsLoading() {
  return (
    <TableSkeleton
      title="Sesi Pembelajaran Aktif"
      description="Daftar sesi belajar harian, nomor pertemuan, dan status pelaksanaan."
      columns={6}
      rows={8}
    />
  );
}
