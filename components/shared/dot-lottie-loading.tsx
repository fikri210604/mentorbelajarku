"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DotLottieLoadingProps {
  /**
   * Path atau URL file animasi DotLottie (.lottie atau .json)
   * Default: '/animations/loading.lottie'
   */
  src?: string;
  /** Custom Lottie element jika Anda menggunakan <DotLottieReact /> dari @lottiefiles/dotlottie-react */
  children?: React.ReactNode;
  /** Judul teks loading utama */
  title?: string;
  /** Deskripsi atau subtext di bawah judul */
  description?: string;
  /** Ukuran container animasi (default: 'size-32 sm:size-40') */
  sizeClassName?: string;
  /** Mode tampilan: 'page' (konten halaman), 'fullscreen' (overlay), atau 'inline' (modal/widget) */
  mode?: "page" | "fullscreen" | "inline";
  className?: string;
}

/**
 * Base Komponen Global Loading untuk Seluruh Aplikasi.
 * Menggunakan Web Component Canvas Player resmi untuk DotLottie sehingga:
 * 1. Tidak memicu browser file download (karena dirender di HTML5 Canvas).
 * 2. Otomatis memutar file /animations/loading.lottie yang diletakkan pengguna.
 * 3. Menampilkan animasi placeholder elegan bertema Mentor Emerald selagi file memuat.
 */
export function DotLottieLoading({
  src = "/animations/loading.lottie",
  children,
  title = "Memuat Data...",
  description = "Bimbel Belajarku",
  sizeClassName = "size-32 sm:size-40",
  mode = "page",
  className,
}: DotLottieLoadingProps) {
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cek apakah web component dotlottie-player sudah terdaftar di browser
    if (customElements.get("dotlottie-player")) {
      setPlayerLoaded(true);
      return;
    }

    // Muat script dotlottie-player resmi secara dinamis
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs";
    script.type = "module";
    script.onload = () => setPlayerLoaded(true);
    script.onerror = () => setHasError(true);
    document.head.appendChild(script);
  }, []);

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-300",
        mode === "page" && "min-h-[55vh] sm:min-h-[60vh] w-full",
        mode === "fullscreen" && "min-h-screen w-full",
        mode === "inline" && "py-8 w-full",
        className
      )}
    >
      {/* ========================================================================= */}
      {/* SLOT ANIMASI DOTLOTTIE (CANVAS PLAYER RESMI — TANPA DOWNLOAD BROWSER)     */}
      {/* ========================================================================= */}
      <div className={cn("relative flex items-center justify-center mb-3", sizeClassName)}>
        {children ? (
          <div className="size-full flex items-center justify-center">
            {children}
          </div>
        ) : src && playerLoaded && !hasError ? (
          <div className="size-full flex items-center justify-center animate-in fade-in duration-300">
            {React.createElement("dotlottie-player", {
              ref: (node: HTMLElement | null) => {
                if (node) {
                  try {
                    (node as any).loop = true;
                    (node as any).autoplay = true;
                  } catch {}
                }
              },
              src,
              background: "transparent",
              style: { width: "100%", height: "100%" },
              onError: () => setHasError(true),
            })}
          </div>
        ) : (
          /* Placeholder Elegan Bertema Mentor Emerald (#00A86B) */
          <div className="relative size-full flex items-center justify-center">
            {/* Outer Ripple Pulse Ring */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />

            {/* Middle Glow Ring */}
            <div className="absolute inset-2 sm:inset-3 rounded-full bg-primary/15 dark:bg-primary/20 blur-md animate-pulse" />

            {/* Inner Rotating Dashed Ring */}
            <div className="absolute inset-3 sm:inset-4 rounded-full border-2 border-dashed border-primary/40 dark:border-primary/50 animate-spin [animation-duration:8s]" />

            {/* Center Disc Logo */}
            <div className="relative size-16 sm:size-20 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-md flex items-center justify-center transition-transform hover:scale-105">
              <div className="size-10 sm:size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="size-6 sm:size-7 text-primary stroke-[2.2] animate-bounce [animation-duration:2s]" />
              </div>
              <Sparkles className="absolute -top-1.5 -right-1.5 size-4 text-emerald-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TEKS BRANDING & INDIKATOR MEMUAT                                          */}
      {/* ========================================================================= */}
      <div className="space-y-1 max-w-xs mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* 3 Indikator Dots Halus */}
      <div className="flex items-center justify-center gap-1.5 mt-3.5">
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );

  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
