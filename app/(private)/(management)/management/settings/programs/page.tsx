import ProgramsPage from "@/features/management/settings/components/ProgramsPage";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Program | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();
  const { data: programs } = await supabase.from("programs").select("*").order("name");

  return <ProgramsPage initialPrograms={programs || []} />;
}
