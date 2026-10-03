import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorStudentsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Murid Bimbingan"
      description="Daftar murid bimbingan belajar dan perkembangan paket sesi."
      columns={5}
      rows={6}
    />
  );
}
