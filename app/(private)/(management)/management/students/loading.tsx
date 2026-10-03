import { GlobalLoading } from "@/components/shared/global-loading";

export default function StudentsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Data Murid"
      description="Kelola data murid, riwayat paket belajar, dan penugasan kelas."
      columns={6}
      rows={8}
    />
  );
}
