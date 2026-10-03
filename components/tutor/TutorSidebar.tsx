"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  LogOut,
  UserCog,
  Building2,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

const TUTOR_MENU = [
  { label: "Dashboard", href: "/tutor/dashboard", icon: LayoutDashboard },
  { label: "Murid Saya", href: "/tutor/students", icon: Users },
  { label: "Jadwal Mengajar", href: "/tutor/schedules", icon: Calendar },
  { label: "Input Presensi", href: "/tutor/attendance", icon: ClipboardCheck },
  { label: "Honor & Fee", href: "/tutor/payroll", icon: CreditCard },
  { label: "Profil & Akun", href: "/tutor/profile", icon: UserCog },
];

interface TutorSidebarProps {
  isManagement?: boolean;
}

export function TutorSidebar({ isManagement }: TutorSidebarProps = {}) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    setSidebarOpen,
    closeMobileMenu,
  } = useUiStore();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Hentikan indikator loading saat navigasi selesai (halaman berganti)
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <>
      {/* Sidebar Aside — desktop only (mobile memakai bottom nav) */}
      <aside
        className={cn(
          "bg-card border-r border-border min-h-screen p-4 flex-col justify-between shrink-0 transition-all duration-300 ease-in-out hidden lg:flex",
          sidebarOpen ? "lg:w-64" : "lg:w-0 lg:p-0 lg:overflow-hidden"
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-border flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden">
                <Image
                  src="/logo.jpg"
                  alt="Mentor Belajarku Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm leading-tight truncate text-foreground">
                  Mentor Belajarku
                </h1>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Tutor Portal
                </span>
              </div>
            </div>

            {/* Tombol Tutup / Minimize Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex rounded-lg"
              onClick={() => setSidebarOpen(false)}
              title="Tutup sidebar"
              aria-label="Tutup sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {isManagement && (
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-800 dark:text-purple-300">
                <Building2 className="w-4 h-4" />
                <span>Akun Manajemen Aktif</span>
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
                Anda sedang berada di mode pengajar.
              </p>
              <Link
                href="/management/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Portal Manajemen</span>
              </Link>
            </div>
          )}

          <div className="space-y-1">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Menu Tutor
            </p>
            {TUTOR_MENU.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/tutor/dashboard" && pathname.startsWith(item.href));
              const isPending = pendingHref === item.href && !isActive;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    if (pathname !== item.href) {
                      setPendingHref(item.href);
                    }
                    closeMobileMenu();
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-sm"
                      : isPending
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isPending && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-2">
          <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-xs space-y-1 border border-emerald-500/20">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              {isManagement ? "Role: Manajemen (Tutor)" : "Role: Tutor Pengajar"}
            </p>
            <p className="text-muted-foreground text-[11px]">Portal Absensi & Honor Mandiri</p>
          </div>

          <a
            href="/api/v1/auth/logout"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar (Logout)</span>
          </a>
        </div>
      </aside>
    </>
  );
}
