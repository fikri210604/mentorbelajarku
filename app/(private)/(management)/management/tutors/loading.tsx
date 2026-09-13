import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function TutorsLoading() {
  return (
    <TableSkeleton
      title="Data Tutor"
      description="Kelola data pengajar, keahlian mata pelajaran, dan penugasan murid."
      columns={6}
      rows={8}
    />
  );
}
