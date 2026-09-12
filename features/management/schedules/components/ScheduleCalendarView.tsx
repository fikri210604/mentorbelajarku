"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  User,
  Users,
  GraduationCap,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Table as TableIcon,
  Info,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ScheduleWithDetails } from "../types";

const DAYS_ORDER = [
  { index: 1, name: "Senin", short: "Sen" },
  { index: 2, name: "Selasa", short: "Sel" },
  { index: 3, name: "Rabu", short: "Rab" },
  { index: 4, name: "Kamis", short: "Kam" },
  { index: 5, name: "Jumat", short: "Jum" },
  { index: 6, name: "Sabtu", short: "Sab" },
  { index: 0, name: "Minggu", short: "Min" },
];

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 7;

interface ScheduleCalendarViewProps {
  schedules: ScheduleWithDetails[];
  userRole?: "management" | "tutor";
  createUrl?: string;
  detailBaseUrl?: string;
}

export function ScheduleCalendarView({
  schedules = [],
  userRole = "management",
  createUrl = "/management/schedules/new",
  detailBaseUrl = "/management/schedules",
}: ScheduleCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "agenda" | "table">("calendar");
  const [selectedBimbelType, setSelectedBimbelType] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSchedule, setActiveSchedule] = useState<ScheduleWithDetails | null>(null);

  // Hari ini (0=Minggu, 1=Senin, dst)
  const todayDayIndex = new Date().getDay();

  // Extract unique bimbel types for filter
  const bimbelTypes = useMemo(() => {
    const types = new Set<string>();
    schedules.forEach((s) => {
      if (s.bimbel_types?.name) types.add(s.bimbel_types.name);
    });
    return Array.from(types);
  }, [schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // Filter bimbel type
      if (selectedBimbelType !== "all" && s.bimbel_types?.name !== selectedBimbelType) {
        return false;
      }
      // Filter day
      if (selectedDay !== "all" && s.day_of_week.toString() !== selectedDay) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const tutor = s.tutors?.profiles?.full_name?.toLowerCase() || "";
        const program = s.programs?.name?.toLowerCase() || "";
        const student = s.students?.name?.toLowerCase() || "";
        const students = s.student_names?.join(" ").toLowerCase() || "";
        const notes = s.notes?.toLowerCase() || "";
        if (
          !tutor.includes(query) &&
          !program.includes(query) &&
          !student.includes(query) &&
          !students.includes(query) &&
          !notes.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, selectedBimbelType, selectedDay, searchQuery]);

  // Helper styling berdasarkan jenis bimbel
  const getBimbelTypeColor = (typeName?: string) => {
    const name = typeName?.toLowerCase() || "";
    if (name.includes("intensif")) {
      return {
        bg: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-100",
        borderAccent: "border-l-amber-500",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
        dot: "bg-amber-500",
      };
    }
    if (name.includes("privat") || name.includes("private")) {
      return {
        bg: "bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/30 text-purple-950 dark:text-purple-100",
        borderAccent: "border-l-purple-500",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
        dot: "bg-purple-500",
      };
    }
    // Reguler / Default
    return {
      bg: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/30 text-blue-950 dark:text-blue-100",
      borderAccent: "border-l-blue-500",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
      dot: "bg-blue-500",
    };
  };

  // Kalkulasi posisi pada grid kalender
  const getEventPosition = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startMinutes = (startH - START_HOUR) * 60 + (startM || 0);
    const endMinutes = (endH - START_HOUR) * 60 + (endM || 0);
    const duration = Math.max(endMinutes - startMinutes, 45); // minimal 45m

    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 48);

    return { top, height };
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={userRole === "management" ? "/management/dashboard" : "/tutor/dashboard"}>
              Beranda
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {userRole === "management" ? "Jadwal Belajar" : "Jadwal Mengajar"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* KONDISI 1: BELUM ADA JADWAL SAMA SEKALI */}
      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={userRole === "management" ? "Belum Ada Jadwal Belajar" : "Belum Ada Jadwal Mengajar"}
          description={
            userRole === "management"
              ? "Saat ini belum ada jadwal belajar rutin yang tersimpan di sistem. Buat jadwal baru untuk mulai mengatur jam belajar antara tutor dan siswa."
              : "Anda saat ini belum memiliki jadwal rutin mengajar mingguan yang ditugaskan oleh Manajemen."
          }
          action={
            userRole === "management" ? (
              <Button asChild className="gap-1.5 shadow-sm">
                <Link href={createUrl}>
                  <Plus className="w-4 h-4" />
                  <span>Buat Jadwal Pertama</span>
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Control Bar: View Switcher, Search, Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border shadow-xs">
            {/* View Switcher Buttons */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-full md:w-auto">
              <Button
                type="button"
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="h-8 text-xs gap-1.5 flex-1 md:flex-initial"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Kalender Mingguan</span>
              </Button>
          <Button
            type="button"
            variant={viewMode === "agenda" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("agenda")}
            className="h-8 text-xs gap-1.5 flex-1 md:flex-initial"
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 text-xs gap-1.5 flex-1 md:flex-initial"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari murid, tutor, mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          {/* Filter Bimbel Type */}
          <select
            value={selectedBimbelType}
            onChange={(e) => setSelectedBimbelType(e.target.value)}
            className="h-8 px-2.5 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Jenis Bimbel</option>
            {bimbelTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Filter Hari */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="h-8 px-2.5 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Hari</option>
            {DAYS_ORDER.map((d) => (
              <option key={d.index} value={d.index.toString()}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend Badge Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">Keterangan:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Reguler (60m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Intensif (75m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span>Private (90m)</span>
          </div>
        </div>

        <div className="text-[11px]">
          Total <span className="font-bold text-foreground">{filteredSchedules.length}</span> jadwal rutin
        </div>
      </div>

      {/* MAIN VIEW: 1. GOOGLE CALENDAR TIME-GRID VIEW */}
      {viewMode === "calendar" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Scrollable Container with Min Width for Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header: Hari-hari dalam seminggu */}
              <div className="grid grid-cols-8 border-b border-border bg-muted/40 text-center font-medium text-xs sticky top-0 z-20">
                {/* Kolom Waktu (Pojok Kiri) */}
                <div className="p-3 border-r border-border text-muted-foreground font-semibold flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Jam
                </div>

                {/* 7 Kolom Hari */}
                {DAYS_ORDER.map((d) => {
                  const isToday = d.index === todayDayIndex;
                  return (
                    <div
                      key={d.index}
                      className={cn(
                        "p-3 border-r border-border last:border-r-0 transition-colors",
                        isToday ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                      )}
                    >
                      <div className="text-xs uppercase tracking-wider">{d.name}</div>
                      {isToday && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-primary text-primary-foreground">
                          Hari Ini
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Body: Grid Jam & Sesi Belajar */}
              <div className="relative grid grid-cols-8 divide-x divide-border">
                {/* Kolom Indikator Waktu Vertikal */}
                <div className="flex flex-col bg-muted/10 select-none">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-border/50 text-[11px] font-mono text-muted-foreground pr-2 pt-1 text-right flex items-start justify-end"
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* 7 Kolom Jadwal Hari */}
                {DAYS_ORDER.map((d) => {
                  const daySchedules = filteredSchedules.filter((s) => s.day_of_week === d.index);
                  const isToday = d.index === todayDayIndex;

                  return (
                    <div
                      key={d.index}
                      className={cn(
                        "relative flex flex-col transition-colors",
                        isToday ? "bg-primary/[0.02]" : "bg-transparent"
                      )}
                      style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
                    >
                      {/* Garis Grid Per Jam */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          className="border-b border-border/40 w-full pointer-events-none"
                        />
                      ))}

                      {/* Indikator Jika Hari Ini Belum Ada Jadwal */}
                      {daySchedules.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none select-none">
                          <CalendarDays className="w-5 h-5 mb-1 text-muted-foreground/30" />
                          <span className="text-[11px] font-medium text-muted-foreground/50">
                            Belum ada jadwal
                          </span>
                        </div>
                      )}

                      {/* Event Cards dalam Kolom Hari */}
                      {daySchedules.map((schedule) => {
                        const styleConfig = getBimbelTypeColor(schedule.bimbel_types?.name);
                        const pos = getEventPosition(schedule.start_time, schedule.end_time);

                        const targetLabel =
                          schedule.total_students && schedule.total_students > 1
                            ? `Kelompok (${schedule.total_students} Murid)`
                            : schedule.students?.name ||
                              (schedule.student_names && schedule.student_names[0]) ||
                              "Privat";

                        return (
                          <div
                            key={schedule.id}
                            onClick={() => setActiveSchedule(schedule)}
                            style={{
                              top: `${pos.top}px`,
                              height: `${pos.height}px`,
                            }}
                            className={cn(
                              "absolute left-1 right-1 rounded-md p-1.5 border border-l-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:z-30 overflow-hidden flex flex-col justify-between text-left",
                              styleConfig.bg,
                              styleConfig.borderAccent
                            )}
                            title={`Klik untuk detail jadwal: ${schedule.programs?.name}`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10px] font-semibold leading-none">
                                <span className="font-mono">
                                  {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                </span>
                                <span
                                  className={cn(
                                    "px-1 py-0.2 rounded text-[9px] font-medium uppercase border",
                                    styleConfig.badge
                                  )}
                                >
                                  {schedule.bimbel_types?.name}
                                </span>
                              </div>

                              <div className="font-semibold text-xs leading-tight line-clamp-1 mt-0.5">
                                {schedule.programs?.name || "Bimbingan Belajar"}
                              </div>

                              <div className="flex items-center gap-1 text-[11px] opacity-90 truncate">
                                <User className="w-3 h-3 shrink-0 opacity-70" />
                                <span className="truncate font-medium">{targetLabel}</span>
                              </div>
                            </div>

                            {/* Footer card info */}
                            <div className="flex items-center justify-between text-[10px] opacity-80 pt-0.5 border-t border-border/20">
                              <span className="truncate flex items-center gap-1">
                                <GraduationCap className="w-2.5 h-2.5 shrink-0" />
                                {schedule.tutors?.profiles?.full_name || "Tutor"}
                              </span>
                              {schedule.location && (
                                <span className="truncate flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  {schedule.location}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW: 2. AGENDA VIEW (DAFTAR PER HARI) */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          {DAYS_ORDER.map((d) => {
            const daySchedules = filteredSchedules.filter((s) => s.day_of_week === d.index);
            const isToday = d.index === todayDayIndex;

            if (daySchedules.length === 0 && selectedDay !== "all" && selectedDay !== d.index.toString()) {
              return null;
            }

            return (
              <div
                key={d.index}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 shadow-xs transition-all",
                  isToday && "ring-2 ring-primary/40"
                )}
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      {d.name}
                    </h3>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {daySchedules.length} Sesi Terjadwal
                  </span>
                </div>

                {daySchedules.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center italic">
                    Tidak ada jadwal belajar di hari {d.name}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {daySchedules.map((schedule) => {
                      const styleConfig = getBimbelTypeColor(schedule.bimbel_types?.name);
                      return (
                        <div
                          key={schedule.id}
                          onClick={() => setActiveSchedule(schedule)}
                          className={cn(
                            "rounded-lg border border-l-4 p-3.5 space-y-2 cursor-pointer hover:shadow-md transition-all",
                            styleConfig.bg,
                            styleConfig.borderAccent
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold flex items-center gap-1 text-foreground">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                                styleConfig.badge
                              )}
                            >
                              {schedule.bimbel_types?.name} ({schedule.bimbel_types?.duration_minutes}m)
                            </span>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm text-foreground">
                              {schedule.programs?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 shrink-0" />
                              {schedule.total_students && schedule.total_students > 1
                                ? `Kelompok (${schedule.total_students} Murid): ${schedule.student_names?.join(", ") || "-"}`
                                : schedule.students?.name || "Privat"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                              {schedule.tutors?.profiles?.full_name || "Tutor"}
                            </span>
                            <StatusBadge status={schedule.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MAIN VIEW: 3. TABULAR TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Hari & Jam</th>
                  <th className="px-4 py-3">Tipe / Program</th>
                  <th className="px-4 py-3">Tutor Pengajar</th>
                  <th className="px-4 py-3">Target (Murid / Kelas)</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Tidak ada jadwal yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      onClick={() => setActiveSchedule(schedule)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium">
                        {DAYS_ORDER.find((d) => d.index === schedule.day_of_week)?.name || "Hari"}, {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{schedule.bimbel_types?.name}</span>
                        <span className="text-muted-foreground text-xs block">{schedule.programs?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {schedule.tutors?.profiles?.full_name || "Tutor"}
                      </td>
                      <td className="px-4 py-3">
                        {schedule.total_students && schedule.total_students > 1 ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              Kelompok ({schedule.total_students} Murid)
                            </span>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {schedule.student_names?.join(", ") || schedule.notes || "-"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-foreground">
                            {schedule.students?.name ||
                              (schedule.student_names && schedule.student_names[0]) ||
                              "Privat"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{schedule.location || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={schedule.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSchedule(schedule);
                          }}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KONDISI 2: FILTER TIDAK MENEMUKAN HASIL */}
      {filteredSchedules.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <CalendarX className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-base text-foreground">
              Tidak Ditemukan Jadwal yang Sesuai
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Tidak ada jadwal belajar yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBimbelType("all");
              setSelectedDay("all");
              setSearchQuery("");
            }}
            className="text-xs"
          >
            Reset Filter Pencarian
          </Button>
        </div>
      )}
        </>
      )}

      {/* DETAIL SCHEDULE MODAL (INTERACTIVE DIALOG GOOGLE CALENDAR STYLE) */}
      <Dialog open={!!activeSchedule} onOpenChange={(open) => !open && setActiveSchedule(null)}>
        <DialogContent className="sm:max-w-md">
          {activeSchedule && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border",
                      getBimbelTypeColor(activeSchedule.bimbel_types?.name).badge
                    )}
                  >
                    {activeSchedule.bimbel_types?.name} • {activeSchedule.bimbel_types?.duration_minutes} Menit
                  </span>
                  <StatusBadge status={activeSchedule.status} />
                </div>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {activeSchedule.programs?.name || "Bimbingan Belajar"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID Jadwal: <span className="font-mono">{activeSchedule.id}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-sm">
                {/* Waktu & Hari */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Jadwal Pelaksanaan</p>
                    <p className="font-semibold text-foreground">
                      Setiap {DAYS_ORDER.find((d) => d.index === activeSchedule.day_of_week)?.name},{" "}
                      <span className="font-mono">
                        {activeSchedule.start_time.slice(0, 5)} - {activeSchedule.end_time.slice(0, 5)} WIB
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tutor Pengajar */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Tutor Pengajar</p>
                    <p className="font-semibold text-foreground">
                      {activeSchedule.tutors?.profiles?.full_name || "Tutor Belajar"}
                    </p>
                  </div>
                </div>

                {/* Murid Peserta */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500 shrink-0" />
                      Peserta Belajar
                    </span>
                    <span className="font-semibold text-foreground">
                      {activeSchedule.total_students || 1} Siswa
                    </span>
                  </div>

                  <div className="pt-1">
                    {activeSchedule.student_names && activeSchedule.student_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeSchedule.student_names.map((name, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-xs font-medium bg-background border border-border text-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-foreground">
                        {activeSchedule.students?.name || "Siswa Terdaftar"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lokasi / Ruangan */}
                {activeSchedule.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span>Ruang / Lokasi: <strong className="text-foreground">{activeSchedule.location}</strong></span>
                  </div>
                )}

                {activeSchedule.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/50">
                    <span className="font-semibold block text-foreground mb-0.5">Catatan:</span>
                    {activeSchedule.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSchedule(null)}
                >
                  Tutup
                </Button>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`${detailBaseUrl}/${activeSchedule.id}`}>
                    <span>Buka Detail Lengkap</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
