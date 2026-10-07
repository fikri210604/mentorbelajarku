import { GlobalLoading } from "@/components/shared/global-loading";

export default function PayrollLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Penggajian Tutor"
      description="Sheet penggajian bulanan tiap tutor dan kalkulasi honor berdasarkan kehadiran."
      columns={6}
      rows={8}
    />
  );
}
