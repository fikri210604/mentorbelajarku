import { GlobalLoading } from "@/components/shared/global-loading";

export default function SettingsLoading() {
  return (
    <GlobalLoading
      variant="detail"
      title="Pengaturan Sistem"
      description="Konfigurasi master data bimbel, tarif tutor, dan kebijakan operasional."
    />
  );
}
