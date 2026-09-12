import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Page() {
  const user = await getCurrentUser();
  if (user?.role === "tutor") {
    redirect("/tutor/payroll");
  }
  redirect("/management/payroll");
}
