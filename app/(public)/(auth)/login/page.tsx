import LoginPage from "@/features/auth/components/LoginPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk Akun | Bimbel Belajarku",
};

export default function Page() {
  return <LoginPage />;
}
