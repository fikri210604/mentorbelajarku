import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorAttendanceLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Presensi Murid"
      description="Pencatatan presensi kehadiran murid berbasis foto kegiatan belajar."
      columns={5}
      rows={6}
    />
  );
}
