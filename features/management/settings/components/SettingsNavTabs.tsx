"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, BookOpen, PackageCheck, Coins, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  {
    label: "Jenis Bimbel",
    href: "/management/settings/bimbel-types",
    icon: Layers,
    desc: "Pengaturan kategori & durasi menit",
  },
  {
    label: "Program & Mata Pelajaran",
    href: "/management/settings/programs",
    icon: BookOpen,
    desc: "Master mata pelajaran & kurikulum",
  },
  {
    label: "Paket Belajar",
    href: "/management/settings/packages",
    icon: PackageCheck,
    desc: "Kuota pertemuan, jenjang & harga paket",
  },
  {
    label: "Tarif Honor Tutor",
    href: "/management/settings/tutor-rates",
    icon: Coins,
    desc: "Tarif mengajar per sesi / student",
  },
  {
    label: "Gaji Manajemen (Owner)",
    href: "/management/settings/management-rates",
    icon: Building2,
    desc: "Gaji staf & pimpinan manajemen",
  },
];

export function SettingsNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-3 mb-6 border-b border-border scrollbar-none sm:flex-wrap">
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
