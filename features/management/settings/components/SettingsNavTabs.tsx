"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  BookOpen,
  BookMarked,
  PackageCheck,
  Coins,
  Building2,
  Clock,
  GraduationCap,
  Wallet,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCog,
  KeyRound,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  desc: string;
  badge?: string;
  count?: number;
}

export interface DomainGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  badgeCount?: number;
  items: TabItem[];
}

export const SETTINGS_DOMAINS: DomainGroup[] = [
  {
    id: "curriculum",
    title: "Kurikulum & Akademik",
    icon: GraduationCap,
    badgeCount: 3,
    items: [
      {
        id: "bimbel-types",
        label: "Jenis Bimbel & Durasi",
        href: "/management/settings/bimbel-types",
        icon: Layers,
        desc: "Kategori bimbel (Reguler, Intensif, Private) & durasi standar menit",
      },
      {
        id: "programs",
        label: "Program Bimbingan",
        href: "/management/settings/programs",
        icon: BookOpen,
        desc: "Jenjang program bimbingan (SD, SMP, SMA, Alumni)",
      },
      {
        id: "subjects",
        label: "Mata Pelajaran & Silabus",
        href: "/management/settings/subjects",
        icon: BookMarked,
        desc: "Daftar mapel dan silabus bab materi untuk jurnal belajar",
      },
    ],
  },
  {
    id: "finance",
    title: "Finansial & Tarif",
    icon: Wallet,
    badgeCount: 3,
    items: [
      {
        id: "packages",
        label: "Paket Belajar Murid",
        href: "/management/settings/packages",
        icon: PackageCheck,
        desc: "Kuota sesi pertemuan, masa aktif, dan harga pendaftaran",
      },
      {
        id: "tutor-rates",
        label: "Tarif Honor Tutor",
        href: "/management/settings/tutor-rates",
        icon: Coins,
        desc: "Standar tarif per murid hadir untuk perhitungan payroll otomatis",
      },
      {
        id: "management-rates",
        label: "Gaji Manajemen",
        href: "/management/settings/management-rates",
        icon: Building2,
        desc: "Skema honor bulanan staf dan pimpinan manajemen",
        badge: "Owner",
      },
    ],
  },
  {
    id: "system",
    title: "Sistem & Kebijakan",
    icon: SettingsIcon,
    badgeCount: 4,
    items: [
      {
        id: "attendance-window",
        label: "Batas Waktu Absensi",
        href: "/management/settings/attendance-window",
        icon: Clock,
        desc: "Toleransi jam pengunggahan presensi & batas kunci absensi tutor",
      },
      {
        id: "roles",
        label: "Peran & Hak Akses (RBAC)",
        href: "/management/settings/roles",
        icon: ShieldCheck,
        desc: "Konfigurasi matriks wewenang operasional dinamis per sub-role",
        badge: "Owner",
      },
      {
        id: "users",
        label: "Pengguna & Akun Staf",
        href: "/management/settings/users",
        icon: UserCog,
        desc: "Penetapan peran dan manajemen status akun staf manajemen",
      },
      {
        id: "permissions",
        label: "Katalog Permission",
        href: "/management/settings/permissions",
        icon: KeyRound,
        desc: "Daftar kode wewenang keamanan sistem granular",
      },
    ],
  },
];

export function SettingsNavTabs() {
  const pathname = usePathname();

  // Jika berada di root hub /management/settings, jangan render bar subpage ini
  // karena halaman utama sudah memiliki kartu dashboard master sendiri.
  if (pathname === "/management/settings") {
    return null;
  }

  // Cari domain aktif berdasarkan URL
  const activeDomain =
    SETTINGS_DOMAINS.find((d) => d.items.some((item) => item.href === pathname)) ||
    SETTINGS_DOMAINS[0];

  // Cari item aktif
  const activeItem = activeDomain.items.find((item) => item.href === pathname);

  return (
    <div className="space-y-4 mb-6">
      {/* 1. BREADCRUMB NAVIGASI DINAMIS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/dashboard">Beranda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/settings">Pengaturan</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground font-medium">
                {activeDomain.title}
              </span>
            </BreadcrumbItem>
            {activeItem && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold text-foreground">
                    {activeItem.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/management/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Pusat Pengaturan</span>
        </Link>
      </div>

      {/* 2. SELECTOR KATEGORI / DOMAIN UTAMA */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SETTINGS_DOMAINS.map((domain) => {
          const isDomainActive = domain.id === activeDomain.id;
          const DomainIcon = domain.icon;

          return (
            <Link
              key={domain.id}
              href={domain.items[0].href}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer",
                isDomainActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border"
              )}
            >
              <DomainIcon className="w-3.5 h-3.5" />
              <span>{domain.title}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isDomainActive
                    ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {domain.items.length}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 3. CARD NAVIGASI SESUAI KATEGORI AKTIF (TIDAK HILANG SAAT BERPINDAH HALAMAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {activeDomain.items.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-all relative overflow-hidden group cursor-pointer",
                isCurrent
                  ? "bg-card border-primary ring-2 ring-primary/20 shadow-xs"
                  : "bg-card/70 hover:bg-card border-border/80 hover:border-border hover:shadow-xs"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/90"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold truncate",
                      isCurrent ? "text-primary font-bold" : "text-foreground"
                    )}
                  >
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {tab.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {tab.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsNavTabs;
