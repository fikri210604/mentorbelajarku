import { Tables } from "@/types/database";

export type Tutor = Tables<"tutors">;
export type Profile = Tables<"profiles">;

export interface TutorWithProfile extends Tutor {
  profiles?: Profile | null;
  rates?: (Tables<"tutor_rates"> & {
    bimbel_types?: Tables<"bimbel_types"> | null;
  })[];
}
