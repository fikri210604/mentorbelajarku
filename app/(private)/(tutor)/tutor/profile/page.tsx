import { Metadata } from "next";
import { requireAuthUser } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import TutorProfilePage from "@/features/tutor/profile/components/TutorProfilePage";

export const metadata: Metadata = {
  title: "Profil & Keamanan Akun | Bimbel Belajarku",
  description: "Kelola profil tutor dan perbarui kata sandi akun Anda.",
};

export default async function Page() {
  const session = await requireAuthUser();
  const supabase = createServerClient();

  let tutorBio = "";
  try {
    if (session.profile?.id) {
      const { data: tutor } = await supabase
        .from("tutors")
        .select("bio")
        .eq("profile_id", session.profile.id)
        .maybeSingle();

      if (tutor?.bio) {
        tutorBio = tutor.bio;
      }
    }
  } catch (err) {
    console.warn("Could not fetch tutor bio from database:", err);
  }

  return (
    <TutorProfilePage
      initialData={{
        userId: session.user.id,
        fullName: session.profile?.full_name || session.user.name,
        email: session.user.email,
        phone: session.profile?.phone || "",
        bio: tutorBio || "Tutor pengajar aktif di Bimbel Belajarku.",
        role: session.role,
        mustChangePassword: session.profile?.must_change_password ?? false,
      }}
    />
  );
}
