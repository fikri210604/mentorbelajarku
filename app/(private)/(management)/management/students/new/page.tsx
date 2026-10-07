import StudentFormPage from "@/features/management/students/components/StudentFormPage";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Murid Baru | Bimbel Belajarku",
};

export default async function Page() {
  const supabase = createServerClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, level, status")
    .eq("status", "active")
    .order("name", { ascending: true });

  return <StudentFormPage programs={programs ?? []} />;
}
