import { create } from "zustand";

export interface NetworkState {
  isOnline: boolean;
  isPoorConnection: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  latencyMs: number | null;
  wasOffline: boolean;
  isChecking: boolean;
  isAlertDismissed: boolean;
  isOfflineDismissed: boolean;
  isMinimized: boolean;
  lastChecked: number | null;

  setOnline: (isOnline: boolean) => void;
  setPoorConnection: (isPoor: boolean) => void;
  setNetworkInfo: (info: {
    effectiveType?: string | null;
    downlink?: number | null;
    rtt?: number | null;
  }) => void;
  setAlertDismissed: (dismissed: boolean) => void;
  setIsOfflineDismissed: (dismissed: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setWasOffline: (wasOffline: boolean) => void;
  checkConnection: () => Promise<boolean>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isPoorConnection: false,
  effectiveType: null,
  downlink: null,
  rtt: null,
  latencyMs: null,
  wasOffline: false,
  isChecking: false,
  isAlertDismissed: false,
  isOfflineDismissed: false,
  isMinimized: false,
  lastChecked: null,

  setOnline: (isOnline) => {
    const prevOnline = get().isOnline;
    set((state) => ({
      isOnline,
      // Jika sebelumnya offline dan sekarang online, tandai wasOffline untuk feedback sukses
      wasOffline: !prevOnline && isOnline ? true : state.wasOffline,
      // Reset minimize jika status berubah ke offline
      isMinimized: !isOnline ? false : state.isMinimized,
      // Reset offline dismiss jika kembali online
      isOfflineDismissed: isOnline ? false : state.isOfflineDismissed,
    }));
  },

  setPoorConnection: (isPoorConnection) => set({ isPoorConnection }),

  setNetworkInfo: (info) =>
    set((state) => ({
      effectiveType: info.effectiveType !== undefined ? info.effectiveType : state.effectiveType,
      downlink: info.downlink !== undefined ? info.downlink : state.downlink,
      rtt: info.rtt !== undefined ? info.rtt : state.rtt,
    })),

  setAlertDismissed: (isAlertDismissed) => set({ isAlertDismissed }),

  setIsOfflineDismissed: (isOfflineDismissed) => set({ isOfflineDismissed }),

  setIsMinimized: (isMinimized) => set({ isMinimized }),

  setWasOffline: (wasOffline) => set({ wasOffline }),

  checkConnection: async () => {
    set({ isChecking: true });
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`/api/health?t=${Date.now()}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (response.ok) {
        const wasOff = !get().isOnline || get().wasOffline;
        const currentEffective = get().effectiveType;
        const isPoorByEffective = currentEffective === "slow-2g" || currentEffective === "2g";
        const isPoorByLatency = duration > 1800;
        const isPoor = isPoorByEffective || isPoorByLatency;

        set({
          isOnline: true,
          wasOffline: wasOff,
          isPoorConnection: isPoor,
          latencyMs: duration,
          lastChecked: Date.now(),
          isChecking: false,
          isOfflineDismissed: false,
        });
        return true;
      } else {
        set({
          isOnline: false,
          wasOffline: true,
          isChecking: false,
          lastChecked: Date.now(),
        });
        return false;
      }
    } catch {
      clearTimeout(timeoutId);
      set({
        isOnline: false,
        wasOffline: true,
        latencyMs: null,
        isChecking: false,
        lastChecked: Date.now(),
      });
      return false;
    }
  },
}));
