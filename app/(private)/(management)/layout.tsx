import { requireAuthUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ManagementSidebar } from "@/components/management/ManagementSidebar";
import { ManagementHeader } from "@/components/management/ManagementHeader";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAuthUser();

  if (currentUser.role !== "management" && currentUser.role !== "admin") {
    redirect("/tutor/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      <ManagementSidebar subrole={currentUser.subrole} userName={currentUser.user.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <ManagementHeader />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-full">{children}</main>
      </div>
    </div>
  );
}
