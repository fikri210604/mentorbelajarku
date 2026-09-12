import ManagementSettingsPage from "@/features/management/settings/components/ManagementSettingsPage";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pusat Pengaturan & Master Data | Bimbel Belajarku",
};

interface SettingsPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function Page({ searchParams }: SettingsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedTab = resolvedParams.tab as any;

  const session = await requireAuthUser();
  const supabase = createServerClient();

  const [bimbelRes, programsRes, packagesRes, ratesRes, mgmtRatesRes, tutorsRes] =
    await Promise.all([
      supabase.from("bimbel_types").select("*").order("duration_minutes"),
      supabase.from("programs").select("*").order("name"),
      supabase
        .from("bimbel_packages")
        .select("*, bimbel_types (*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("tutor_rates")
        .select("*, bimbel_types (*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("management_rates")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("tutors")
        .select("id, status, profiles (id, full_name, role)")
        .order("created_at", { ascending: true }),
    ]);

  return (
    <ManagementSettingsPage
      initialBimbelTypes={bimbelRes.data || []}
      initialPrograms={programsRes.data || []}
      initialPackages={packagesRes.data || []}
      initialRates={ratesRes.data || []}
      initialManagementRates={mgmtRatesRes.data || []}
      tutorsList={tutorsRes.data || []}
      currentSubrole={session.subrole}
      defaultTab={
        ["bimbel-types", "programs", "packages", "tutor-rates", "management-rates"].includes(
          requestedTab
        )
          ? requestedTab
          : "bimbel-types"
      }
    />
  );
}
