"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Camera,
  Users,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorBottomNavProps {
  hasActiveSession?: boolean;
}

export function TutorBottomNav({ hasActiveSession = true }: TutorBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Beranda",
      href: "/tutor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Jadwal",
      href: "/tutor/schedules",
      icon: CalendarDays,
    },
    // Center Action Button (Index 2 - Special Highlight)
    {
      label: "Presensi",
      href: "/tutor/attendance",
      icon: Camera,
      isCenter: true,
    },
    {
      label: "Murid",
      href: "/tutor/students",
      icon: Users,
    },
    {
      label: "Honor",
      href: "/tutor/payroll",
      icon: CreditCard,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Mobile Tutor"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-2 py-1.5 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-300"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/tutor/dashboard" && pathname.startsWith(item.href));

          // Center Button: Tombol Absensi yang Menonjol (Floating CTA)
          if (item.isCenter) {
            return (
              <div key={item.href} className="relative -mt-6 flex flex-col items-center">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center size-14 rounded-full shadow-lg transition-all duration-200 active:scale-95",
                    "bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white",
                    "ring-4 ring-background focus:outline-none focus:ring-emerald-400/50",
                    isActive && "ring-emerald-500/40 scale-105"
                  )}
                  aria-label="Lakukan Absensi Sesi Sekarang"
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />

                  {/* Pulsing Dot jika ada sesi hari ini yang aktif */}
                  {hasActiveSession && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-background" />
                    </span>
                  )}
                </Link>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1 tracking-tight transition-colors",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          }

          // Item Biasa (Kiri & Kanan)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 stroke-[2.3]")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
