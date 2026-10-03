import { GlobalLoading } from "@/components/shared/global-loading";

export default function PayrollLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Honor & Payroll Tutor"
      description="Kalkulasi otomatis honor mengajar berdasarkan kehadiran dan rate terkonfigurasi."
      columns={6}
      rows={8}
    />
  );
}
