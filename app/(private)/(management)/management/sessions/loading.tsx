import { GlobalLoading } from "@/components/shared/global-loading";

export default function SessionsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Sesi Pembelajaran Aktif"
      description="Daftar sesi belajar harian, nomor pertemuan, dan status pelaksanaan."
      columns={6}
      rows={8}
    />
  );
}
