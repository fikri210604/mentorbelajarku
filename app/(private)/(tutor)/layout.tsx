import { requireAuthUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { TutorHeader } from "@/components/tutor/TutorHeader";
export const dynamic = "force-dynamic";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAuthUser();

  // Role tutor, management, dan admin diizinkan membuka portal tutor (Dual-Role capability)
  if (
    currentUser.role !== "tutor" &&
    currentUser.role !== "management" &&
    currentUser.role !== "admin"
  ) {
    redirect("/login");
  }

  const isManagement = currentUser.role === "management" || currentUser.role === "admin";

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      <TutorSidebar isManagement={isManagement} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TutorHeader isManagement={isManagement} />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-full">{children}</main>
      </div>
    </div>
  );
}
