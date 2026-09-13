import { TableSkeleton } from "@/components/shared/skeletons/table-skeleton";

export default function AttendanceLoading() {
  return (
    <TableSkeleton
      title="Rekap Absensi Siswa"
      description="Verifikasi absensi foto, izin, sakit, dan pergantian jadwal."
      columns={6}
      rows={8}
    />
  );
}
