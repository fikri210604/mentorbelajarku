import TutorRatesPage from "@/features/management/settings/components/TutorRatesPage";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Standar Tarif Honor Tutor | Bimbel Belajarku",
};

export default async function Page() {
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

  return (
    <TutorRatesPage
      initialRates={ratesRes.data ?? []}
      bimbelTypesList={bimbelTypesRes.data ?? []}
    />
  );
}
