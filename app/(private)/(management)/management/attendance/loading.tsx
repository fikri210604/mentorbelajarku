import { GlobalLoading } from "@/components/shared/global-loading";

export default function AttendanceLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Rekap Absensi Siswa"
      description="Verifikasi absensi foto, izin, sakit, dan pergantian jadwal."
      columns={6}
      rows={8}
    />
  );
}
