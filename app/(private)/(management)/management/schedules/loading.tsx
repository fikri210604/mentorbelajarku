import { GlobalLoading } from "@/components/shared/global-loading";

export default function SchedulesLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Jadwal Pembelajaran"
      description="Kelola master jadwal rutin bimbingan belajar per sesi dan tutor."
      columns={6}
      rows={8}
    />
  );
}
