"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNetworkStore } from "@/stores/network-store";
import { toast } from "sonner";

export function ConnectionAlert() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const pathname = usePathname();

  // Notifikasi popup hanya relevan di portal privat (tutor/manajemen)
  const isPublicRoute =
    !pathname ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // Sync status ke Zustand store (agar form seperti AttendanceForm tetap dapat mendeteksi status offline)
  useEffect(() => {
    try {
      const store = useNetworkStore.getState();
      if (typeof store?.setOnline === "function") {
        store.setOnline(isOnline);
      }
    } catch {
      // ignore
    }
  }, [isOnline]);

  // 1. Listener event online/offline dari browser
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (!isPublicRoute) {
        toast.success("Koneksi Internet Pulih", {
          description: "Anda telah terhubung kembali ke jaringan.",
          id: "network-status-online",
          duration: 3500,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (!isPublicRoute) {
        toast.error("Koneksi Internet Terputus", {
          description: "Sinyal internet hilang atau tidak stabil. Pastikan WiFi atau paket data aktif.",
          id: "network-status-offline",
          duration: 5000,
        });
      }
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          setIsOnline(true);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [isPublicRoute]);

  // 2. Auto-Heartbeat saat offline: probe ke /api/health untuk auto-recovery
  useEffect(() => {
    if (isOnline) return;

    let cancelled = false;

    const probe = async () => {
      const isBrowserOnline = typeof navigator !== "undefined" && navigator.onLine;
      if (isBrowserOnline) {
        if (!cancelled) {
          setIsOnline(true);
        }
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`/api/health?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok && !cancelled) {
          setIsOnline(true);
          if (!isPublicRoute) {
            toast.success("Koneksi Internet Pulih", {
              description: "Anda telah terhubung kembali ke jaringan.",
              id: "network-status-online",
              duration: 3500,
            });
          }
        }
      } catch {
        // fetch gagal — belum pulih
      }
    };

    const interval = setInterval(probe, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOnline, isPublicRoute]);

  // Alert banner besar di tengah bawah layar dinonaktifkan agar tidak menutupi tampilan antarmuka.
  // Notifikasi offline/online kini sepenuhnya ditangani oleh popup toast (Sonner) di pojok.
  return null;
}

export default ConnectionAlert;
