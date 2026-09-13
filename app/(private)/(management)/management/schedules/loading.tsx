import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function SchedulesLoading() {
  return (
    <TableSkeleton
      title="Jadwal Pembelajaran"
      description="Kelola master jadwal rutin bimbingan belajar per sesi dan tutor."
      columns={6}
      rows={8}
    />
  );
}
