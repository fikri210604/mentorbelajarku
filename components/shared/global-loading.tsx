import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export type GlobalLoadingVariant =
  | "default"
  | "table"
  | "dashboard"
  | "detail"
  | "minimal";

export interface GlobalLoadingProps {
  /**
   * Varian tampilan skeleton:
   * - 'default': Skeleton universal komprehensif (Header + 4 Stat Cards + Content area)
   * - 'table': Khusus halaman tabel data (Header + Filter Bar + Baris Tabel + Paginasi)
   * - 'dashboard': Khusus halaman dashboard (Header + Stat Cards + Chart Area + Side List)
   * - 'detail': Khusus halaman detail entity/murid/tutor (Profile Banner + Tabs + Info Grid)
   * - 'minimal': Spinner & label ringkas untuk modal / widget inline
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
 * Komponen Tunggal Global Loading untuk Seluruh Aplikasi (MentorBelajarku).
 * Menggantikan skeleton yang terfragmentasi agar seluruh loading state di aplikasi
 * memiliki ritme visual, animasi shimmer, dan estetika yang seragam dan konsisten.
 */
export function GlobalLoading({
  variant = "default",
  title,
  description,
  text,
  showBreadcrumb = true,
  showStats,
  columns = 5,
  rows = 7,
  className,
}: GlobalLoadingProps) {
  const displayDescription = description || text;
  // Varian Minimal: Untuk modal, widget kecil, atau drawer
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "w-full min-h-[240px] flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-200",
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="w-4 h-4 text-primary absolute animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Memuat data...</p>
          <p className="text-xs text-muted-foreground">Menyiapkan informasi sistem</p>
        </div>
      </div>
    );
  }

  // Tentukan apakah stat cards perlu ditampilkan
  const shouldRenderStats =
    showStats !== undefined
      ? showStats
      : variant === "dashboard" || variant === "default";

  return (
    <div
      className={cn(
        "space-y-6 w-full animate-in fade-in duration-300",
        className
      )}
    >
      {/* 1. TOP BREADCRUMB & LIVE BRAND BADGE */}
      <div className="flex items-center justify-between gap-4">
        {showBreadcrumb ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <span className="text-muted-foreground/30 text-xs">/</span>
            <Skeleton className="h-4 w-28" />
          </div>
        ) : (
          <div />
        )}

        {/* Subtle Live Loading Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px]">Memuat data...</span>
        </div>
      </div>

      {/* 2. PAGE HEADER SKELETON */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            <Skeleton className="h-8 w-48 sm:w-64" />
          )}
          {displayDescription ? (
            <p className="text-sm text-muted-foreground">{displayDescription}</p>
          ) : (
            <Skeleton className="h-4 w-60 sm:w-80" />
          )}
        </div>

        {/* Action Buttons Placeholder */}
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-9 w-24 sm:w-28 rounded-md" />
          <Skeleton className="h-9 w-28 sm:w-32 rounded-md" />
        </div>
      </div>

      {/* 3. METRIC / STAT CARDS SKELETON */}
      {shouldRenderStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border/60 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 4. MAIN CONTENT SKELETON (Menyesuaikan Varian) */}
      {variant === "dashboard" ? (
        // Layout Khusus Dashboard: Chart Utama + Side Cards
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-border/60 shadow-xs">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full flex items-end gap-3 pt-6 pb-2 px-4 bg-muted/20 rounded-lg">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <Skeleton
                      className="w-full rounded-t-sm"
                      style={{ height: `${25 + ((idx * 17) % 65)}%` }}
                    />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : variant === "detail" ? (
        // Layout Khusus Detail: Profile Banner + Tabs + Dual Cards
        <div className="space-y-6">
          <Card className="p-6 border border-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </Card>

          <div className="flex gap-2 border-b border-border/60 pb-2">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-36" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </Card>
            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-36" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        // Layout Default & Table: Filter Bar + Clean Data Table + Pagination
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 w-full sm:max-w-md items-center gap-2">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-border/60 rounded-lg overflow-hidden bg-card shadow-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/60 bg-muted/30">
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center",
                    i === 0
                      ? "col-span-3 sm:col-span-2"
                      : i === 1
                      ? "col-span-4 sm:col-span-3"
                      : "col-span-2"
                  )}
                >
                  <Skeleton className="h-4 w-full max-w-[100px]" />
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/40">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors"
                >
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className={cn(
                        "flex items-center",
                        colIndex === 0
                          ? "col-span-3 sm:col-span-2"
                          : colIndex === 1
                          ? "col-span-4 sm:col-span-3"
                          : "col-span-2"
                      )}
                    >
                      <Skeleton
                        className="h-4 rounded"
                        style={{
                          width: `${50 + ((rowIndex * 19 + colIndex * 29) % 45)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Table Pagination Footer */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 border-t border-border/60 bg-muted/10">
              <Skeleton className="h-4 w-36" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// Menjamin seluruh pemanggilan lama (TableSkeleton, DashboardSkeleton) tetap berfungsi 100%
// ==============================================================================

export function TableSkeleton(props: GlobalLoadingProps) {
  return <GlobalLoading variant="table" {...props} />;
}

export function DashboardSkeleton(props: GlobalLoadingProps) {
  return <GlobalLoading variant="dashboard" {...props} />;
}

export default GlobalLoading;
