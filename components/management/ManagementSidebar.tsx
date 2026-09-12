"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Settings,
  LayoutDashboard,
  Building2,
  LogOut,
  ShieldCheck,
  X,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagementSubrole } from "@/types/auth";
import { canSubroleAccessRoute } from "@/lib/permissions";
import { SYNTHETIC_USERS } from "@/data/users";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

const MANAGEMENT_MENU = [
  { label: "Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
  { label: "Data Murid", href: "/management/students", icon: Users },
  { label: "Data Tutor", href: "/management/tutors", icon: GraduationCap },
  { label: "Jadwal", href: "/management/schedules", icon: Calendar },
  { label: "Sesi Belajar", href: "/management/sessions", icon: Clock },
  { label: "Presensi", href: "/management/attendance", icon: ClipboardCheck },
  { label: "Payroll / Honor", href: "/management/payroll", icon: CreditCard },
  { label: "Laporan", href: "/management/reports/attendance", icon: BarChart3 },
  { label: "Pengaturan", href: "/management/settings", icon: Settings },
];

interface ManagementSidebarProps {
  subrole?: ManagementSubrole | null;
  userName?: string;
}

export function ManagementSidebar({
  subrole: initialSubrole,
  userName: initialUserName,
}: ManagementSidebarProps = {}) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    setSidebarOpen,
    mobileMenuOpen,
    closeMobileMenu,
  } = useUiStore();

  const [activeSubrole, setActiveSubrole] = useState<ManagementSubrole | null>(
    initialSubrole || null
  );
  const [activeName, setActiveName] = useState<string>(initialUserName || "Management");

  // Otomatis menutup sidebar mobile jika rute halaman berganti
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)synthetic_user_id=([^;]+)/);
      if (match && match[1]) {
        const found = SYNTHETIC_USERS.find(
          (u) => u.id === match[1] || u.email.toLowerCase() === match[1].toLowerCase()
        );
        if (found) {
          setActiveSubrole(found.subrole || (found.role === "management" ? "owner" : null));
          setActiveName(found.name);
        }
      }
    }
  }, []);

  // Filter menu berdasarkan subrole (HRD, Keuangan, Owner)
  const filteredMenu = MANAGEMENT_MENU.filter((item) =>
    canSubroleAccessRoute(activeSubrole, item.href)
  );

  const getSubroleLabel = (sub?: ManagementSubrole | null) => {
    switch (sub) {
      case "hrd":
        return {
          title: "HRD & Operasional",
          desc: "Pengelolaan Murid, Tutor & Jadwal",
          badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        };
      case "finance":
        return {
          title: "Keuangan & Payroll",
          desc: "Pengelolaan Honor & Tarif",
          badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        };
      case "owner":
      default:
        return {
          title: "Owner / Super Admin",
          desc: "Akses Penuh Seluruh Modul",
          badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
        };
    }
  };

  const subroleInfo = getSubroleLabel(activeSubrole);

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
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                  Management Portal
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

          <div className="space-y-1">
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu Utama
              </p>
              {activeSubrole && (
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {activeSubrole}
                </span>
              )}
            </div>

            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/management/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
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
          <div className="px-3 py-2 rounded-lg bg-muted/60 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                {subroleInfo.title}
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-tight">
              {subroleInfo.desc}
            </p>
            <p className="text-[10px] text-muted-foreground truncate pt-0.5 border-t border-border/40 mt-1">
              User: {activeName}
            </p>
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
