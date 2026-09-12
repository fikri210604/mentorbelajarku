import ManagementRatesPage from "@/features/management/settings/components/ManagementRatesPage";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth/session";
import { SYNTHETIC_MANAGEMENT_RATES } from "@/data/payroll";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Gaji Manajemen | Bimbel Belajarku",
};

export default async function Page() {
  const session = await requireAuthUser();
  const supabase = createServerClient();

  const { data: rates } = await supabase
    .from("management_rates")
    .select("*")
    .order("created_at", { ascending: false });

  const finalRates = rates && rates.length > 0 ? rates : SYNTHETIC_MANAGEMENT_RATES;

  return (
    <ManagementRatesPage
      initialRates={finalRates}
      currentSubrole={session.subrole}
    />
  );
}
