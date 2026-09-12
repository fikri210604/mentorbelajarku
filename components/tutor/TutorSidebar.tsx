"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LogOut,
  UserCog,
  Building2,
  X,
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
    mobileMenuOpen,
    closeMobileMenu,
  } = useUiStore();

  // Otomatis menutup sidebar mobile jika navigasi halaman berganti
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Listener tombol Escape untuk menutup drawer pada mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          "bg-card border-r border-border min-h-screen p-4 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out",
          // Mobile Drawer styling (fixed overlay slide-in)
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl lg:shadow-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop styling (in-flow sidebar)
          "lg:static lg:translate-x-0",
          sidebarOpen ? "lg:flex lg:w-64" : "lg:hidden"
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-base leading-none truncate">Bimbel Tutor</h1>
                <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
                  Tutor Portal
                </span>
              </div>
            </div>

            {/* Tombol Tutup Mobile (X) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden rounded-lg"
              onClick={closeMobileMenu}
              aria-label="Tutup sidebar"
            >
              <X className="h-4 w-4" />
            </Button>

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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
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
