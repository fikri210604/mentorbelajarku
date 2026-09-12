import { Tables } from "@/types/database";

export type Session = Tables<"sessions">;

export interface SessionWithDetails extends Session {
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  programs?: Tables<"programs"> | null;
  bimbel_types?: Tables<"bimbel_types"> | null;
  attendance?: (Tables<"attendance"> & { students?: Tables<"students"> | null })[];
  students?: Array<{ id: string; name: string; student_code: string }>;
}
