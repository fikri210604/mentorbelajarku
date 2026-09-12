import PackagesPage from "@/features/management/settings/components/PackagesPage";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Paket Belajar | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();

  const [{ data: packages }, { data: bimbelTypes }] = await Promise.all([
    supabase
      .from("bimbel_packages")
      .select("*, bimbel_types (*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("bimbel_types")
      .select("*")
      .order("duration_minutes", { ascending: true }),
  ]);

  return (
    <PackagesPage
      initialPackages={packages || []}
      bimbelTypesList={bimbelTypes || []}
    />
  );
}
