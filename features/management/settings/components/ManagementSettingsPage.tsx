"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  BookMarked,
  PackageCheck,
  Coins,
  Building2,
  Clock,
  ShieldCheck,
  UserCog,
  KeyRound,
  GraduationCap,
  Wallet,
  Settings as SettingsIcon,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import BimbelTypesPage from "./BimbelTypesPage";
import ProgramsPage from "./ProgramsPage";
import PackagesPage from "./PackagesPage";
import TutorRatesPage from "./TutorRatesPage";
import ManagementRatesPage from "./ManagementRatesPage";
import RolesManagementPage from "./RolesManagementPage";
import { Permission, PermissionDefinition, RoleWithPermissions } from "@/types/auth";
import { SETTINGS_DOMAINS, TabItem, isSettingTabAllowed } from "./SettingsNavTabs";
import { isOwnerRoleName } from "@/lib/permissions/resolver";

interface ManagementSettingsPageProps {
  initialBimbelTypes?: any[];
  initialPrograms?: any[];
  initialPackages?: any[];
  initialRates?: any[];
  initialManagementRates?: any[];
  initialRoles?: RoleWithPermissions[];
  initialPermissions?: PermissionDefinition[];
  tutorsList?: any[];
  roleName?: string | null;
  permissions?: Permission[];
  currentSubrole?: string | null;
  defaultTab?: string;
}

export default function ManagementSettingsPage({
  initialBimbelTypes = [],
  initialPrograms = [],
  initialPackages = [],
  initialRates = [],
  initialManagementRates = [],
  initialRoles = [],
  initialPermissions = [],
  tutorsList = [],
  roleName,
  permissions = [],
  currentSubrole = "owner",
  defaultTab = "bimbel-types",
}: ManagementSettingsPageProps) {
  const isOwner = isOwnerRoleName(roleName);
  const canManageRoles = isOwner || permissions.includes("roles:manage");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("all");

  // Cari tab awal yang diizinkan untuk user
  const allowedTabIds = useMemo(() => {
    const ids: string[] = [];
    for (const d of SETTINGS_DOMAINS) {
      for (const item of d.items) {
        if (isSettingTabAllowed(item, roleName, permissions)) {
          ids.push(item.id);
        }
      }
    }
    return ids;
  }, [roleName, permissions]);

  const initialAllowedTab = allowedTabIds.includes(defaultTab)
    ? defaultTab
    : allowedTabIds[0] || "attendance-window";

  const [activeTab, setActiveTab] = useState<string>(initialAllowedTab);

  // Filter items berdasarkan izin user (RBAC) dan pencarian/filter domain
  const filteredDomains = useMemo(() => {
    return SETTINGS_DOMAINS.map((domain) => {
      if (selectedDomainFilter !== "all" && domain.id !== selectedDomainFilter) {
        return null;
      }

      const allowedItems = domain.items.filter((item) =>
        isSettingTabAllowed(item, roleName, permissions)
      );

      const matchingItems = allowedItems.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          domain.title.toLowerCase().includes(q)
        );
      });

      if (matchingItems.length === 0) return null;

      return {
        ...domain,
        items: matchingItems,
      };
    }).filter(Boolean) as typeof SETTINGS_DOMAINS;
  }, [searchQuery, selectedDomainFilter, roleName, permissions]);

  // Tab yang mendukung inline editing di halaman utama
  const inlineTabs = [
    "bimbel-types",
    "programs",
    "packages",
    "tutor-rates",
    "management-rates",
    "roles",
  ];

  // Hitung jumlah item dinamis untuk badge
  const countsMap: Record<string, number> = {
    "bimbel-types": initialBimbelTypes.length,
    programs: initialPrograms.length,
    packages: initialPackages.length,
    "tutor-rates": initialRates.length,
    "management-rates": initialManagementRates.length,
    roles: initialRoles.length,
    permissions: initialPermissions.length,
  };

  const activeTabDetails = useMemo(() => {
    for (const domain of SETTINGS_DOMAINS) {
      const found = domain.items.find((item) => item.id === activeTab);
      if (found) {
        return { item: found, domain };
      }
    }
    return null;
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB UTAMA */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/dashboard">Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold text-foreground">
              Pengaturan & Master Data
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. HERO HEADER DENGAN SEARCH & FILTER */}
      <div className="rounded-2xl border border-border/80 bg-linear-to-b from-card to-card/60 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Pusat Pengaturan & Master Data
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                10 Modul
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Kelola acuan operasional bimbel terbagi ke dalam 3 pilar: kurikulum & mata pelajaran, paket & tarif honor, serta keamanan sistem operasional.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari pengaturan (honor, mapel...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>
        </div>

        {/* 3. FILTER PILL KATEGORI */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDomainFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer",
              selectedDomainFilter === "all"
                ? "bg-foreground text-background border-foreground shadow-2xs"
                : "bg-background text-muted-foreground hover:text-foreground border-border"
            )}
          >
            Semua (10)
          </button>
          {SETTINGS_DOMAINS.map((domain) => {
            const isSelected = selectedDomainFilter === domain.id;
            const DomainIcon = domain.icon;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomainFilter(domain.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted/60"
                )}
              >
                <DomainIcon className="w-3.5 h-3.5" />
                <span>{domain.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {domain.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. KARTU NAVIGASI UTAMA (DIKELOMPOKKAN PER KATEGORI - TIDAK HILANG) */}
      <div className="space-y-6">
        {filteredDomains.map((domain) => {
          const DomainIcon = domain.icon;
          return (
            <div key={domain.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <DomainIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {domain.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({domain.items.length} modul)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {domain.items.map((item) => {
                  const Icon = item.icon;
                  const isInline = inlineTabs.includes(item.id);
                  const isCurrentActive = activeTab === item.id;
                  const count = countsMap[item.id];

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between p-4 bg-card",
                        isCurrentActive
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border/80 hover:border-border hover:shadow-xs"
                      )}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={cn(
                              "p-2.5 rounded-xl shrink-0 transition-colors",
                              isCurrentActive
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {item.badge && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[10px] font-bold py-0"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {count !== undefined && !item.badge && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {count} data
                              </span>
                            )}
                            {isCurrentActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-foreground line-clamp-1">
                            {item.label}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Aksi Navigasi */}
                      <div className="pt-4 mt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        {isInline ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              // Smooth scroll ke panel kerja jika di mobile
                              const el = document.getElementById("active-settings-panel");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className={cn(
                              "text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1",
                              isCurrentActive
                                ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                                : "bg-muted/60 hover:bg-muted text-foreground"
                            )}
                          >
                            <span>{isCurrentActive ? "Sedang Dibuka" : "Kelola Di Sini"}</span>
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Buka Modul</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <Link
                          href={item.href}
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 p-1"
                          title="Buka di halaman khusus"
                        >
                          <span className="hidden sm:inline">Halaman Penuh</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. WORKSPACE PANEL UNTUK KONTEN AKTIF */}
      <div id="active-settings-panel" className="pt-4 space-y-4">
        {activeTabDetails && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/70 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Panel Aktif:
              </span>
              <Badge variant="outline" className="bg-background text-xs font-bold text-foreground">
                {activeTabDetails.item.label}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ({activeTabDetails.domain.title})
              </span>
            </div>

            <Link
              href={activeTabDetails.item.href}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
            >
              <span>Buka di Halaman Khusus Mandiri</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* RENDER KOMPONEN TAB */}
        {activeTab === "bimbel-types" && (
          <BimbelTypesPage initialBimbelTypes={initialBimbelTypes} />
        )}

        {activeTab === "programs" && (
          <ProgramsPage initialPrograms={initialPrograms} />
        )}

        {activeTab === "packages" && (
          <PackagesPage
            initialPackages={initialPackages}
            bimbelTypesList={initialBimbelTypes}
          />
        )}

        {activeTab === "tutor-rates" && (
          <TutorRatesPage
            initialRates={initialRates}
            bimbelTypesList={initialBimbelTypes}
          />
        )}

        {activeTab === "management-rates" && isOwner && (
          <ManagementRatesPage
            initialRates={initialManagementRates}
            roleName={roleName}
            currentSubrole={currentSubrole}
          />
        )}

        {activeTab === "roles" && canManageRoles && (
          <RolesManagementPage
            initialRoles={initialRoles}
            initialPermissions={initialPermissions}
            roleName={roleName}
            permissions={permissions}
            currentSubrole={currentSubrole}
          />
        )}
      </div>
    </div>
  );
}
