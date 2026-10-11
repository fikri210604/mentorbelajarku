import { Tables } from "@/types/database";

export type Tutor = Tables<"tutors">;
export type Profile = Tables<"profiles">;

export type TutorGender = "male" | "female";

export interface TutorProfile extends Profile {
  email?: string | null;
}

export interface TutorWithProfile extends Tutor {
  profiles?: TutorProfile | null;
  rates?: (Tables<"tutor_rates"> & {
    bimbel_types?: Tables<"bimbel_types"> | null;
  })[];
}
