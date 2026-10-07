import ManagementRatesPage from "@/features/management/settings/components/ManagementRatesPage";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth/session";
import { isOwnerRoleName } from "@/lib/permissions/resolver";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Gaji Manajemen | Bimbel Belajarku",
};

export default async function Page() {
  const session = await requireAuthUser();

  if (!isOwnerRoleName(session.roleName)) {
    redirect("/management/dashboard?error=forbidden");
  }

  const supabase = createServerClient();

  const { data: rates } = await supabase
    .from("management_rates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <ManagementRatesPage
      initialRates={rates ?? []}
      roleName={session.roleName}
      currentSubrole={session.subrole}
    />
  );
}
