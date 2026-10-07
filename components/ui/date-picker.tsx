"use client"

import * as React from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

interface DecadeGroup {
  decade: number
  label: string
  years: number[]
}

function getDecadeGroups(fromYear: number, toYear: number): DecadeGroup[] {
  const groups: DecadeGroup[] = []
  const maxDecade = Math.floor(toYear / 10) * 10
  const minDecade = Math.floor(fromYear / 10) * 10

  for (let dec = maxDecade; dec >= minDecade; dec -= 10) {
    const years: number[] = []
    const decEnd = Math.min(toYear, dec + 9)
    const decStart = Math.max(fromYear, dec)

    for (let y = decEnd; y >= decStart; y--) {
      years.push(y)
    }

    if (years.length > 0) {
      let subLabel = ""
      if (dec === 2020) subLabel = " (PAUD / SD)"
      else if (dec === 2010) subLabel = " (SD / SMP / SMA)"
      else if (dec === 2000) subLabel = " (Kuliah / Dewasa)"

      groups.push({
        decade: dec,
        label: `${dec} - ${dec + 9}${subLabel}`,
        years,
      })
    }
  }

  return groups
}

export interface DatePickerProps {
  value?: Date | string | null
  onChange?: (date: Date | undefined, dateString: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  minDate?: Date
  maxDate?: Date
  clearable?: boolean
  showTime?: boolean
  timeValue?: string // "HH:mm"
  onTimeChange?: (time: string) => void
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  className,
  id,
  minDate,
  maxDate,
  clearable = false,
  showTime = false,
  timeValue = "16:00",
  onTimeChange,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalTime, setInternalTime] = React.useState(timeValue)
  const [viewMode, setViewMode] = React.useState<"calendar" | "grid">("calendar")

  const [prevTimeValue, setPrevTimeValue] = React.useState(timeValue)
  if (prevTimeValue !== timeValue) {
    setPrevTimeValue(timeValue)
    if (timeValue) setInternalTime(timeValue)
  }

  // Safe parsing of Date object or "YYYY-MM-DD" string to avoid timezone offset shifts
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value
    if (typeof value === "string") {
      const parts = value.split("-")
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        return new Date(year, month, day)
      }
      const d = new Date(value)
      return isNaN(d.getTime()) ? undefined : d
    }
    return undefined
  }, [value])

  const effectiveMinYear = minDate ? minDate.getFullYear() : fromYear || 1950
  const effectiveMaxYear = maxDate ? maxDate.getFullYear() : toYear || new Date().getFullYear() + 5

  const decadeGroups = React.useMemo(() => {
    return getDecadeGroups(effectiveMinYear, effectiveMaxYear)
  }, [effectiveMinYear, effectiveMaxYear])

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (selectedDate) return selectedDate
    if (maxDate && maxDate < new Date()) return maxDate
    return new Date()
  })

  const [selectedDecade, setSelectedDecade] = React.useState<number>(() => {
    const y = selectedDate?.getFullYear() || (maxDate && maxDate < new Date() ? maxDate.getFullYear() : new Date().getFullYear())
    return Math.floor(y / 10) * 10
  })

  const [prevSelectedDate, setPrevSelectedDate] = React.useState(selectedDate)
  if (prevSelectedDate !== selectedDate) {
    setPrevSelectedDate(selectedDate)
    if (selectedDate) {
      setCurrentMonth(selectedDate)
      setSelectedDecade(Math.floor(selectedDate.getFullYear() / 10) * 10)
    }
  }

  const [prevOpen, setPrevOpen] = React.useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setViewMode("calendar")
      if (selectedDate) {
        setCurrentMonth(selectedDate)
        setSelectedDecade(Math.floor(selectedDate.getFullYear() / 10) * 10)
      }
    }
  }

  const decadeYears = React.useMemo(() => {
    const years: number[] = []
    const decStart = selectedDecade
    const decEnd = selectedDecade + 9
    for (let y = decStart; y <= decEnd; y++) {
      years.push(y)
    }
    return years
  }, [selectedDecade])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleMonthSelect = (m: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), m, 1))
  }

  const handleYearSelect = (y: number) => {
    setCurrentMonth((prev) => new Date(y, prev.getMonth(), 1))
    setSelectedDecade(Math.floor(y / 10) * 10)
  }

  const handleTodayClick = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDecade(Math.floor(today.getFullYear() / 10) * 10)
    handleSelect(today)
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      if (clearable) {
        onChange?.(undefined, "")
        setOpen(false)
      }
      return
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`
    onChange?.(date, dateStr)
    if (!showTime) {
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined, "")
  }

  const handleTimeSelect = (t: string) => {
    setInternalTime(t)
    onTimeChange?.(t)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal text-xs h-9 px-3",
              !selectedDate && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">
          {selectedDate ? (
            showTime && internalTime ? (
              `${format(selectedDate, "d MMMM yyyy", { locale: idLocale })}, ${internalTime} WIB`
            ) : (
              format(selectedDate, "d MMMM yyyy", { locale: idLocale })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        {clearable && selectedDate && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            className="ml-1 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Hapus tanggal"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover shadow-xl border rounded-xl overflow-hidden" align="start">
        {/* Header Navigasi Cerdas dengan Pilihan Bulan & Tahun (Grouped) */}
        <div className="flex items-center justify-between gap-1 p-2.5 border-b bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={handlePrevMonth}
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 flex-1 justify-center px-1">
            {/* Dropdown Bulan */}
            <select
              value={currentMonth.getMonth()}
              onChange={(e) => handleMonthSelect(parseInt(e.target.value, 10))}
              className="h-7 text-xs font-semibold bg-background border rounded px-1.5 py-0.5 text-foreground cursor-pointer hover:border-primary transition-colors focus:ring-1 focus:ring-primary focus:outline-none"
              title="Pilih Bulan"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            {/* Dropdown Tahun dengan Pengelompokan Dekade */}
            <select
              value={currentMonth.getFullYear()}
              onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))}
              className="h-7 text-xs font-semibold bg-background border rounded px-1.5 py-0.5 text-foreground cursor-pointer hover:border-primary transition-colors focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              title="Pilih Tahun (Dikelompokkan Berdasarkan Dekade)"
            >
              {decadeGroups.map((group) => (
                <optgroup key={group.decade} label={group.label}>
                  {group.years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Tombol Switch Mode Grid Dekade Cepat */}
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-7 w-7 shrink-0 cursor-pointer",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode(viewMode === "grid" ? "calendar" : "grid")}
            title={viewMode === "grid" ? "Kembali ke Kalender Hari" : "Cari Cepat Grup Tahun & Bulan"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={handleNextMonth}
            title="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === "grid" ? (
          /* TAMPILAN PENCARIAN GRUP TAHUN & BULAN CEPAT */
          <div className="p-3 w-72 sm:w-80 space-y-3 bg-card animate-in fade-in-50 duration-150">
            {/* 1. Baris Pilih Grup Dekade */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                1. Pilih Rentang Dekade:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {decadeGroups.map((group) => {
                  const isSelected = selectedDecade === group.decade
                  return (
                    <button
                      key={group.decade}
                      type="button"
                      onClick={() => setSelectedDecade(group.decade)}
                      className={cn(
                        "text-[10px] font-mono px-2 py-1 rounded-md border whitespace-nowrap transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
                      )}
                    >
                      {group.decade}s
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Grid Tahun dalam Dekade Terpilih */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  2. Pilih Tahun ({selectedDecade} - {selectedDecade + 9}):
                </span>
                <span className="text-[10px] font-mono text-primary font-bold">
                  {currentMonth.getFullYear()}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {decadeYears.map((y) => {
                  const isCurrentYear = currentMonth.getFullYear() === y
                  const isOutRange = (minDate && y < minDate.getFullYear()) || (maxDate && y > maxDate.getFullYear())
                  return (
                    <button
                      key={y}
                      type="button"
                      disabled={isOutRange}
                      onClick={() => handleYearSelect(y)}
                      className={cn(
                        "text-xs font-mono py-1.5 rounded border text-center transition-colors cursor-pointer",
                        isCurrentYear
                          ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                          : "bg-muted/30 hover:bg-muted text-foreground border-border/70",
                        isOutRange && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Grid 12 Bulan */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  3. Pilih Bulan:
                </span>
                <span className="text-[10px] text-primary font-bold">
                  {MONTH_NAMES[currentMonth.getMonth()]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MONTH_SHORT.map((mShort, idx) => {
                  const isCurrentMonth = currentMonth.getMonth() === idx
                  return (
                    <button
                      key={mShort}
                      type="button"
                      onClick={() => {
                        handleMonthSelect(idx)
                        setViewMode("calendar")
                      }}
                      className={cn(
                        "text-xs py-1.5 rounded border text-center font-medium transition-colors cursor-pointer",
                        isCurrentMonth
                          ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                          : "bg-muted/30 hover:bg-muted text-foreground border-border/70"
                      )}
                    >
                      {mShort}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("calendar")}
                className="text-xs h-7 px-2.5 cursor-pointer text-primary font-medium hover:text-primary"
              >
                Lihat Kalender Hari →
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTodayClick}
                className="text-xs h-7 px-2 cursor-pointer"
              >
                Hari Ini
              </Button>
            </div>
          </div>
        ) : (
          /* TAMPILAN KALENDER HARI */
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={idLocale}
              classNames={{
                month_caption: "hidden",
                nav: "hidden",
              }}
              disabled={(d) => {
                if (minDate && d < minDate) return true
                if (maxDate && d > maxDate) return true
                return false
              }}
            />

            {/* Footer Kalender */}
            <div className="border-t p-2 bg-muted/15 flex items-center justify-between text-xs">
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={handleTodayClick}
                className="text-[11px] h-6 px-2 text-primary font-medium hover:text-primary cursor-pointer"
              >
                Hari Ini
              </Button>

              {selectedDate && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {format(selectedDate, "dd/MM/yyyy")}
                </span>
              )}

              {clearable && selectedDate && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={handleClear}
                  className="text-[11px] h-6 px-2 text-destructive hover:text-destructive cursor-pointer"
                >
                  Hapus
                </Button>
              )}
            </div>
          </div>
        )}

        {showTime && (
          <div className="border-t p-3 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Pilih Jam:
              </span>
              <Input
                type="time"
                value={internalTime}
                onChange={(e) => handleTimeSelect(e.target.value)}
                className="w-24 h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {["08:00", "09:30", "13:30", "15:30", "16:00", "17:15", "18:30"].map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="xs"
                  variant={internalTime === t ? "default" : "outline"}
                  onClick={() => handleTimeSelect(t)}
                  className="text-[10px] h-6 px-1.5 font-mono shrink-0"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// TIMEPICKER COMPONENT
// ============================================================================

export interface TimePickerProps {
  value?: string | null // "HH:mm" e.g. "16:00"
  onChange?: (timeString: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  presets?: string[]
}

const DEFAULT_TIME_PRESETS = [
  "08:00",
  "09:30",
  "10:00",
  "13:30",
  "14:00",
  "15:30",
  "16:00",
  "16:30",
  "17:15",
  "18:30",
  "19:00",
  "19:30",
]

export function TimePicker({
  value,
  onChange,
  placeholder = "Pilih jam",
  disabled = false,
  className,
  id,
  presets = DEFAULT_TIME_PRESETS,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse hour and minute from value (format "HH:mm")
  const [selectedHour, selectedMinute] = React.useMemo(() => {
    if (!value || !value.includes(":")) return ["16", "00"]
    const [h, m] = value.split(":")
    return [h.padStart(2, "0"), m.padStart(2, "0")]
  }, [value])

  const [customInput, setCustomInput] = React.useState(value || "16:00")

  const [prevValue, setPrevValue] = React.useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    if (value) setCustomInput(value)
  }

  const handleApplyTime = (h: string, m: string) => {
    const timeStr = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`
    onChange?.(timeStr)
    setCustomInput(timeStr)
    setOpen(false)
  }

  const handlePresetClick = (preset: string) => {
    onChange?.(preset)
    setCustomInput(preset)
    setOpen(false)
  }

  const hoursList = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, "0")) // 07 to 22
  const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal text-xs h-9 px-3 font-mono",
              !value && "text-muted-foreground font-sans",
              className
            )}
          />
        }
      >
        <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">
          {value ? `${value} WIB` : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 z-50 bg-popover shadow-md border rounded-xl space-y-3" align="start">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Pilih Jam Pembelajaran
          </span>
          {value && (
            <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
              {value} WIB
            </span>
          )}
        </div>

        {/* Quick Presets Sesi Bimbel */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Jadwal Sesi Bimbel Populer:
          </label>
          <div className="grid grid-cols-4 gap-1">
            {presets.map((timePreset) => {
              const isSelected = value === timePreset
              return (
                <button
                  key={timePreset}
                  type="button"
                  onClick={() => handlePresetClick(timePreset)}
                  className={cn(
                    "text-[11px] font-mono py-1 rounded border transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/80"
                  )}
                >
                  {timePreset}
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Hour & Minute Grid Picker */}
        <div className="space-y-1.5 pt-1 border-t">
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold text-muted-foreground">
            <span>JAM ({selectedHour})</span>
            <span>MENIT ({selectedMinute})</span>
          </div>
          <div className="grid grid-cols-2 gap-2 h-36">
            {/* Hour Column */}
            <div className="overflow-y-auto space-y-1 border rounded-lg p-1 bg-muted/20 pr-1">
              {hoursList.map((h) => {
                const isActive = selectedHour === h
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleApplyTime(h, selectedMinute)}
                    className={cn(
                      "w-full text-xs font-mono py-1 rounded text-center transition-colors block",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {h}:00
                  </button>
                )
              })}
            </div>

            {/* Minute Column */}
            <div className="overflow-y-auto space-y-1 border rounded-lg p-1 bg-muted/20 pr-1">
              {minutesList.map((m) => {
                const isActive = selectedMinute === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleApplyTime(selectedHour, m)}
                    className={cn(
                      "w-full text-xs font-mono py-1 rounded text-center transition-colors block",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    :{m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Custom Manual Typing */}
        <div className="flex items-center gap-1.5 pt-1 border-t">
          <Input
            type="time"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="h-7 text-xs font-mono"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (customInput) {
                onChange?.(customInput)
                setOpen(false)
              }
            }}
            className="h-7 text-xs px-2.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <DatePicker
      value={date}
      onChange={(d) => setDate(d)}
    />
  )
}

export default DatePicker