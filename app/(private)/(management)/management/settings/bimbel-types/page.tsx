import BimbelTypesPage from "@/features/management/settings/components/BimbelTypesPage";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jenis Bimbel | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();
  const { data: bimbelTypes } = await supabase.from("bimbel_types").select("*").order("duration_minutes");

  return <BimbelTypesPage initialBimbelTypes={bimbelTypes || []} />;
}
