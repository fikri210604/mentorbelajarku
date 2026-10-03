import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorSessionsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Sesi Pembelajaran"
      description="Daftar pelaksanaan sesi belajar mengajar dan log pertemuan."
      columns={5}
      rows={6}
    />
  );
}
