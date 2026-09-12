"use client";

import { useState } from "react";
import { Layers, BookOpen, PackageCheck, Coins, Building2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import BimbelTypesPage from "./BimbelTypesPage";
import ProgramsPage from "./ProgramsPage";
import PackagesPage from "./PackagesPage";
import TutorRatesPage from "./TutorRatesPage";
import ManagementRatesPage from "./ManagementRatesPage";

interface ManagementSettingsPageProps {
  initialBimbelTypes?: any[];
  initialPrograms?: any[];
  initialPackages?: any[];
  initialRates?: any[];
  initialManagementRates?: any[];
  tutorsList?: any[];
  currentSubrole?: string | null;
  defaultTab?: "bimbel-types" | "programs" | "packages" | "tutor-rates" | "management-rates";
}

export default function ManagementSettingsPage({
  initialBimbelTypes = [],
  initialPrograms = [],
  initialPackages = [],
  initialRates = [],
  initialManagementRates = [],
  tutorsList = [],
  currentSubrole = "owner",
  defaultTab = "bimbel-types",
}: ManagementSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<
    "bimbel-types" | "programs" | "packages" | "tutor-rates" | "management-rates"
  >(defaultTab);

  const tabs = [
    {
      id: "bimbel-types" as const,
      label: "Jenis Bimbel",
      icon: Layers,
      count: initialBimbelTypes.length || 3,
      desc: "Kategori & durasi menit",
    },
    {
      id: "programs" as const,
      label: "Mata Pelajaran",
      icon: BookOpen,
      count: initialPrograms.length || 4,
      desc: "Kurikulum & jenjang",
    },
    {
      id: "packages" as const,
      label: "Paket Belajar",
      icon: PackageCheck,
      count: initialPackages.length || 3,
      desc: "Kuota sesi & harga",
    },
    {
      id: "tutor-rates" as const,
      label: "Tarif Honor Tutor",
      icon: Coins,
      count: initialRates.length || 3,
      desc: "Tarif sama per murid hadir",
    },
    {
      id: "management-rates" as const,
      label: "Gaji Manajemen",
      icon: Building2,
      count: initialManagementRates.length || 4,
      desc: "Gaji staf & pimpinan (Owner)",
      badge: "Owner",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER UTAMA PUSAT PENGATURAN */}
      <div className="border-b border-border/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan & Master Data Bimbel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data acuan operasional bimbel: jenis bimbel, mata pelajaran, paket belajar, standar honor tutor, dan gaji manajemen.
        </p>

        {/* TAB SWITCHER */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden",
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0 mt-0.5",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-xs leading-none truncate text-foreground">
                      {tab.label}
                    </p>
                    {tab.badge ? (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {tab.badge}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KONTEN TAB AKTIF */}
      <div className="pt-1">
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

        {activeTab === "management-rates" && (
          <ManagementRatesPage
            initialRates={initialManagementRates}
            currentSubrole={currentSubrole}
          />
        )}
      </div>
    </div>
  );
}
