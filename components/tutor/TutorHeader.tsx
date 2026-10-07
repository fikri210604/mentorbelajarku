"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Building2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { useUiStore } from "@/stores/ui-store";
import type { CurrentUserSession } from "@/lib/auth/session";

interface TutorHeaderProps {
  isManagement?: boolean;
  user?: CurrentUserSession | null;
}

const PAGE_METAS: Record<string, { title: string; subtitle: string }> = {
  "/tutor/schedules": { title: "Jadwal Mengajar", subtitle: "Kalender & sesi bimbel" },
  "/tutor/attendance": { title: "Presensi & Absensi", subtitle: "Dokumentasi kehadiran" },
  "/tutor/students": { title: "Data Murid", subtitle: "Daftar siswa bimbingan" },
  "/tutor/payroll": { title: "Penggajian", subtitle: "Estimasi honor & riwayat" },
  "/tutor/profile": { title: "Profil Tutor", subtitle: "Pengaturan akun" },
};

export function TutorHeader({ isManagement, user }: TutorHeaderProps = {}) {
  const { toggleSidebar } = useUiStore();
  const pathname = usePathname();

  const isDashboard = pathname === "/tutor/dashboard" || pathname === "/tutor";
  const currentMeta = PAGE_METAS[pathname] || {
    title: "Portal Tutor",
    subtitle: "Bimbel Belajarku",
  };

  const displayName = user?.profile?.full_name || user?.user?.name || "Tutor Pengajar";

  return (
    <header className="border-b border-border bg-card/85 backdrop-blur-md shrink-0 sticky top-0 z-30 transition-all">
      {/* ========================================================================= */}
      {/* 1. TAMPILAN MOBILE (lg:hidden) — SESUAI REFERENSI DESAIN ASLI             */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden items-center justify-between h-16 px-4">
        {isDashboard ? (
          /* Header Dashboard: Avatar + Nama Tutor + Subtitle Role */
          <div className="flex items-center gap-3 min-w-0">
            <UserNav user={user?.user} role="tutor" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground leading-tight truncate">
                {displayName}
              </h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Mentor Pengajar</span>
              </p>
            </div>
          </div>
        ) : (
          /* Header Subpage: Judul Halaman + Subtitle (Gaya Phone 2 pada Referensi) */
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              {currentMeta.title}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {currentMeta.subtitle}
            </p>
          </div>
        )}

        {/* Sisi Kanan Mobile: Tombol Lonceng Notifikasi */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-9 rounded-full border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground relative shadow-2xs"
          >
            <Link href="/tutor/profile" aria-label="Notifikasi & Akun">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
          </Button>

          {!isDashboard && (
            <div className="pl-0.5">
              <UserNav user={user?.user} role="tutor" />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAMPILAN DESKTOP (hidden lg:flex) — TETAP LENGKAP & PROFESIONAL        */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleSidebar}
            title="Buka / Tutup Sidebar"
            aria-label="Buka / Tutup Sidebar"
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0 flex items-center gap-3">
            <BreadcrumbNav />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">
                Portal Tutor Pengajar
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Catat kehadiran dan pantau jadwal mengajar hari ini
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isManagement && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
            >
              <Link href="/management/dashboard">
                <Building2 className="size-3.5" />
                <span>Kembali ke Manajemen</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground size-9 rounded-full hover:bg-muted"
          >
            <Link href="/tutor/profile" aria-label="Notifikasi">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500" />
            </Link>
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <UserNav user={user?.user} role="tutor" />
        </div>
      </div>
    </header>
  );
}
