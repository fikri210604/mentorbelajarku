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
  LogOut,
  ShieldCheck,
  BookMarked,
  FileCheck2,
  X,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/auth";
import { isOwnerRoleName } from "@/lib/permissions/resolver";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
  requiredAnyPermissions?: Permission[];
}

const MANAGEMENT_MENU: MenuItem[] = [
  { label: "Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
  { label: "Data Murid", href: "/management/students", icon: Users, requiredPermission: "student:read" },
  { label: "Data Tutor", href: "/management/tutors", icon: GraduationCap, requiredPermission: "tutor:read" },
  { label: "Jadwal", href: "/management/schedules", icon: Calendar, requiredPermission: "schedule:read" },
  { label: "Sesi Belajar", href: "/management/sessions", icon: Clock, requiredPermission: "session:read" },
  { label: "Presensi", href: "/management/attendance", icon: ClipboardCheck, requiredPermission: "attendance:read" },
  { label: "Catatan Belajar", href: "/management/learning-records", icon: BookMarked, requiredPermission: "worksheet:read" },
  { label: "Evaluasi Murid", href: "/management/progress-reports", icon: FileCheck2, requiredPermission: "progress_report:read" },
  { label: "Payroll / Honor", href: "/management/payroll", icon: CreditCard, requiredPermission: "payroll:read" },
  { label: "Laporan", href: "/management/reports/attendance", icon: BarChart3, requiredPermission: "reports:read" },
  { label: "Audit Log", href: "/management/audit-logs", icon: ShieldCheck, requiredPermission: "audit:read" },
  {
    label: "Pengaturan & Akses",
    href: "/management/settings",
    icon: Settings,
    requiredAnyPermissions: [
      "settings:manage",
      "roles:manage",
      "rates:manage",
      "curriculum:manage",
    ],
  },
];

interface ManagementSidebarProps {
  roleName?: string | null;
  permissions?: Permission[];
  userName?: string;
  subrole?: string | null; // Kompatibilitas mundur
}

export function ManagementSidebar({
  roleName: initialRoleName,
  permissions: initialPermissions = [],
  userName: initialUserName,
  subrole,
}: ManagementSidebarProps = {}) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    setSidebarOpen,
    mobileMenuOpen,
    closeMobileMenu,
  } = useUiStore();

  const effectiveRoleName = initialRoleName || subrole || "management";
  const isOwner = isOwnerRoleName(effectiveRoleName);
  const activePermissions = initialPermissions;

  const [activeName] = useState<string>(initialUserName || "Management");
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Reset pending indicator jika halaman target sudah tercapai
  if (pendingHref && pathname === pendingHref) {
    setPendingHref(null);
  }

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

  // Filter menu dinamis berbasis database permissions (Owner memiliki akses penuh)
  const filteredMenu = MANAGEMENT_MENU.filter((item) => {
    if (isOwner) return true;
    if (!item.requiredPermission && !item.requiredAnyPermissions) return true;
    if (item.requiredPermission) {
      return activePermissions.includes(item.requiredPermission);
    }
    if (item.requiredAnyPermissions) {
      return item.requiredAnyPermissions.some((perm) => activePermissions.includes(perm));
    }
    return false;
  });

  const getRoleBadgeInfo = () => {
    if (isOwner) {
      return {
        title: "Owner / Pimpinan",
        desc: "Akses Penuh & Kontrol Delegasi",
        badge: "Owner",
      };
    }
    const normalized = (effectiveRoleName || "").toLowerCase();
    if (normalized === "hrd") {
      return {
        title: "Divisi HRD & Murid",
        desc: "Manajemen Pengajar & Siswa",
        badge: "HRD",
      };
    }
    if (normalized === "curriculum") {
      return {
        title: "Divisi Kurikulum",
        desc: "Materi, Silabus & Evaluasi",
        badge: "Kurikulum",
      };
    }
    if (normalized === "finance") {
      return {
        title: "Divisi Keuangan",
        desc: "Payroll & Tarif Mengajar",
        badge: "Keuangan",
      };
    }
    return {
      title: effectiveRoleName.charAt(0).toUpperCase() + effectiveRoleName.slice(1),
      desc: "Hak Akses Terkonfigurasi",
      badge: effectiveRoleName.toUpperCase(),
    };
  };

  const roleInfo = getRoleBadgeInfo();

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
              {roleInfo.badge && (
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {roleInfo.badge}
                </span>
              )}
            </div>

            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/management/dashboard" && pathname.startsWith(item.href));
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
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
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
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping shrink-0" />
                  )}
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
                {roleInfo.title}
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-tight">
              {roleInfo.desc}
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
