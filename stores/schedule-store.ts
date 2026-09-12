import { create } from "zustand";

interface ScheduleState {
  selectedDay: number | null;
  selectedTutorId: string | null;
  selectedProgramId: string | null;
  viewMode: "day" | "week";

  setSelectedDay: (day: number | null) => void;
  setSelectedTutorId: (tutorId: string | null) => void;
  setSelectedProgramId: (programId: string | null) => void;
  setViewMode: (mode: "day" | "week") => void;
  resetFilters: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  selectedDay: null,
  selectedTutorId: null,
  selectedProgramId: null,
  viewMode: "week",

  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedTutorId: (tutorId) => set({ selectedTutorId: tutorId }),
  setSelectedProgramId: (programId) => set({ selectedProgramId: programId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  resetFilters: () =>
    set({
      selectedDay: null,
      selectedTutorId: null,
      selectedProgramId: null,
      viewMode: "week",
    }),
}));
