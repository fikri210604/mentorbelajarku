import React from "react";
import { DotLottieLoading, type DotLottieLoadingProps } from "./dot-lottie-loading";

export type GlobalLoadingVariant =
  | "default"
  | "table"
  | "dashboard"
  | "detail"
  | "minimal";

export interface GlobalLoadingProps {
  /**
   * Varian kompatibilitas (kini terpadu dengan DotLottie):
   * - 'minimal': Mode inline untuk widget / modal
   * - 'default', 'table', 'dashboard', 'detail': Standar terpadu DotLottie
   */
  variant?: GlobalLoadingVariant;
  title?: string;
  description?: string;
  text?: string;
  showBreadcrumb?: boolean;
  showStats?: boolean;
  columns?: number;
  rows?: number;
  className?: string;
}

/**
 * Komponen Global Loading Terpadu untuk Seluruh Aplikasi (MentorBelajarku).
 * Menggunakan base animasi DotLottie agar seluruh transisi halaman & pergantian state
 * memiliki estetika, ritme visual, dan tampilan yang seragam dan tidak melompat-lompat.
 */
export function GlobalLoading({
  variant = "default",
  title = "Memuat Data...",
  description,
  text,
  className,
}: GlobalLoadingProps) {
  const displayDescription = description || text || "Bimbel Belajarku";

  return (
    <DotLottieLoading
      title={title}
      description={displayDescription}
      mode={variant === "minimal" ? "inline" : "page"}
      className={className}
    />
  );
}

export { DotLottieLoading };
