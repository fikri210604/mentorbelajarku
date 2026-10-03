import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorPayrollLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Honor & Slip Pembayaran"
      description="Rincian akumulasi honor mengajar dan status pencairan."
      columns={4}
      rows={6}
    />
  );
}
