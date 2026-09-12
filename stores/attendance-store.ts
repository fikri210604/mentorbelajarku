import { create } from "zustand";

interface AttendanceState {
  selectedSessionId: string | null;
  cameraOpen: boolean;
  capturedPhoto: string | null;
  material: string;
  notes: string;
  isSubmitting: boolean;

  setSelectedSessionId: (id: string | null) => void;
  setCameraOpen: (open: boolean) => void;
  setCapturedPhoto: (photo: string | null) => void;
  setMaterial: (material: string) => void;
  setNotes: (notes: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  resetDraft: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  selectedSessionId: null,
  cameraOpen: false,
  capturedPhoto: null,
  material: "",
  notes: "",
  isSubmitting: false,

  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
  setCameraOpen: (open) => set({ cameraOpen: open }),
  setCapturedPhoto: (photo) => set({ capturedPhoto: photo }),
  setMaterial: (material) => set({ material }),
  setNotes: (notes) => set({ notes }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  resetDraft: () =>
    set({
      selectedSessionId: null,
      cameraOpen: false,
      capturedPhoto: null,
      material: "",
      notes: "",
      isSubmitting: false,
    }),
}));
