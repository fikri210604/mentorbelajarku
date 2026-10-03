import { useNetworkStore } from "@/stores/network-store";

export function useNetworkStatus() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const isPoorConnection = useNetworkStore((state) => state.isPoorConnection);
  const latencyMs = useNetworkStore((state) => state.latencyMs);
  const effectiveType = useNetworkStore((state) => state.effectiveType);
  const isChecking = useNetworkStore((state) => state.isChecking);
  const checkConnection = useNetworkStore((state) => state.checkConnection);

  return {
    isOnline,
    isPoorConnection,
    latencyMs,
    effectiveType,
    isChecking,
    checkConnection,
  };
}
