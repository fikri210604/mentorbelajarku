import { GlobalLoading } from "@/components/shared/global-loading";

export default function TutorsLoading() {
  return (
    <GlobalLoading
      variant="table"
      title="Data Tutor"
      description="Kelola data pengajar, keahlian mata pelajaran, dan penugasan murid."
      columns={6}
      rows={8}
    />
  );
}
