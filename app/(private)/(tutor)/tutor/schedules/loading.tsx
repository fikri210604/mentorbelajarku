import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorSchedulesLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Jadwal Mengajar"
      description="Daftar jadwal rutin mengajar dan lokasi pertemuan murid."
      columns={5}
      rows={6}
    />
  );
}
