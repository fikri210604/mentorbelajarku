"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [, startTransition] = useTransition();

  // Reset loading ketika rute/pathname/searchParams selesai berganti
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Global click interceptor untuk mendeteksi navigasi link internal
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Abaikan anchor link (#), link eksternal, new tab, download, atau api route
      const isExternal =
        target.target === "_blank" ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href.startsWith("/api/");

      // Abaikan jika user menahan modifier keys (Ctrl / Cmd / Shift / Alt)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      if (!isExternal) {
        // Cek apakah mengarah ke URL yang berbeda
        const currentUrl = window.location.pathname + window.location.search;
        const targetUrl = new URL(href, window.location.href);
        const targetPath = targetUrl.pathname + targetUrl.search;

        if (currentUrl !== targetPath) {
          startTransition(() => {
            setIsNavigating(true);
          });
        }
      }
    };

    // Tambahkan fallback timeout agar loading tidak gantung selamanya jika navigasi dibatalkan
    const handleTimeout = () => {
      if (isNavigating) {
        const timer = setTimeout(() => setIsNavigating(false), 8000);
        return () => clearTimeout(timer);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [isNavigating]);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[99999] pointer-events-none"
      role="progressbar"
      aria-valuetext="Memuat halaman..."
    >
      {/* Top Animated Progress Bar */}
      <div className="h-1 w-full bg-primary/20 overflow-hidden">
        <div className="h-full bg-primary w-full origin-left animate-indeterminate" />
      </div>

      {/* Floating Badge Indicator di Pojok Kanan Atas */}
      <div className="absolute top-3 right-4 flex items-center gap-2 bg-card/95 text-foreground px-3 py-1.5 rounded-full shadow-lg border border-border/80 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
        <svg
          className="animate-spin h-3.5 w-3.5 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Memuat data...</span>
      </div>
    </div>
  );
}
