"use client";

import { Bell, Building2, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";
import { useUiStore } from "@/stores/ui-store";

interface TutorHeaderProps {
  isManagement?: boolean;
}

export function TutorHeader({ isManagement }: TutorHeaderProps = {}) {
  const { toggleMobileMenu, toggleSidebar } = useUiStore();

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tombol Hamburger Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 lg:hidden"
          onClick={toggleMobileMenu}
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Tombol Hamburger / Collapse Desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 hidden lg:flex"
          onClick={toggleSidebar}
          title="Buka / Tutup Sidebar"
          aria-label="Buka / Tutup Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">Portal Tutor Pengajar</h2>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Catat kehadiran dan pantau jadwal mengajar hari ini</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isManagement && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:flex text-xs gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
          >
            <Link href="/management/dashboard">
              <Building2 className="h-3.5 w-3.5" />
              <span>Kembali ke Manajemen</span>
            </Link>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative text-muted-foreground h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
        </Button>

        <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

        <UserNav role="tutor" />
      </div>
    </header>
  );
}
