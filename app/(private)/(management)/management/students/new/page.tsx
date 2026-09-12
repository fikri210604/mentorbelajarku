import StudentFormPage from "@/features/management/students/components/StudentFormPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Murid Baru | Bimbel Belajarku",
};

export default function Page() {
  return <StudentFormPage />;
}
