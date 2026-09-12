import TutorRatesPage from "@/features/management/settings/components/TutorRatesPage";
import { createServerClient } from "@/lib/supabase/server";
import { SYNTHETIC_TUTOR_RATES } from "@/data/payroll";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Standar Tarif Honor Tutor | Bimbel Belajarku",
};

export default async function Page() {
  let rates: any[] = [];
  try {
    const supabase = createServerClient();
    const [ratesRes, bimbelTypesRes] = await Promise.all([
      supabase
        .from("tutor_rates")
        .select("*, bimbel_types (*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("bimbel_types")
        .select("id, name, duration_minutes, status")
        .order("duration_minutes", { ascending: true }),
    ]);

    if (ratesRes.data && ratesRes.data.length > 0) rates = ratesRes.data;
    const bimbelTypesList = bimbelTypesRes.data || [];

    return (
      <TutorRatesPage
        initialRates={rates.length > 0 ? rates : SYNTHETIC_TUTOR_RATES}
        bimbelTypesList={bimbelTypesList}
      />
    );
  } catch {
    return (
      <TutorRatesPage
        initialRates={SYNTHETIC_TUTOR_RATES}
        bimbelTypesList={[]}
      />
    );
  }
}
