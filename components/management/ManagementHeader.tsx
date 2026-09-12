"use client";

import { Bell, Search, GraduationCap, Menu } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";
import { useUiStore } from "@/stores/ui-store";

export function ManagementHeader() {
  const { toggleMobileMenu, toggleSidebar } = useUiStore();

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
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

        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari murid, tutor, atau jadwal..."
            className="pl-9 h-9 bg-background/50 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:flex text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          <Link href="/tutor/dashboard">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Mode Tutor (Mengajar)</span>
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

        <UserNav role="management" />
      </div>
    </header>
  );
}
