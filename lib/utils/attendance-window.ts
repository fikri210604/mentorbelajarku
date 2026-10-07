export interface AttendanceWindowConfig {
  openBeforeMinutes?: number; // Menit sebelum sesi mulai (default: 15)
  closeAfterHours?: number;   // Jam toleransi setelah sesi mulai (default: 4)
  maxDaysAllowed?: number;    // Toleransi keterlambatan hari H+N (default: 1)
  allowBackdate?: boolean;    // Bebas backdate (default: false)
  sessionDeadlineOverride?: string | null; // Override batas waktu sesi tertentu (ISO string)
  sessionAllowLateUpload?: boolean;
}

export interface AttendanceTimeWindowResult {
  isAllowed: boolean;
  status: 'too_early' | 'open' | 'expired' | 'dispensation_active';
  windowStart: string;
  windowEnd: string;
  message: string;
  isDispensation?: boolean;
}

/**
 * Validasi Jendela Waktu Presensi Dinamis:
 * Mendukung konfigurasi master (jam toleransi, menit buka awal, batas hari)
 * serta override dispensasi spesifik per sesi dari Admin/Management.
 */
export function validateAttendanceTimeWindow(
  sessionDate: string,
  startTime: string,
  config?: AttendanceWindowConfig,
  currentDate: Date = new Date()
): AttendanceTimeWindowResult {
  try {
    const openBeforeMinutes = config?.openBeforeMinutes ?? 15;
    const closeAfterHours = config?.closeAfterHours ?? 4;
    const maxDaysAllowed = config?.maxDaysAllowed ?? 1;
    const allowBackdate = config?.allowBackdate ?? false;
    const sessionDeadline = config?.sessionDeadlineOverride;
    const allowLateUpload = config?.sessionAllowLateUpload ?? false;

    // 0. Cek apakah ada dispensasi deadline khusus per sesi dari admin
    if ((sessionDeadline || allowLateUpload) && sessionDeadline) {
      const deadlineDate = new Date(sessionDeadline);
      if (!isNaN(deadlineDate.getTime())) {
        const isWithinDeadline = currentDate.getTime() <= deadlineDate.getTime();
        const formattedDeadline = `${deadlineDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })} ${String(deadlineDate.getHours()).padStart(2, '0')}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`;

        if (isWithinDeadline) {
          return {
            isAllowed: true,
            status: 'dispensation_active',
            windowStart: startTime,
            windowEnd: formattedDeadline,
            message: `Dispensasi pengisian presensi aktif dari manajemen s/d ${formattedDeadline}.`,
            isDispensation: true,
          };
        }
      }
    }

    // Jika global backdate diizinkan oleh admin
    if (allowBackdate) {
      return {
        isAllowed: true,
        status: 'open',
        windowStart: 'Bebas',
        windowEnd: 'Bebas (Backdate diizinkan)',
        message: 'Pengisian presensi tanggal lampau diizinkan oleh sistem.',
      };
    }

    const [startHourStr, startMinuteStr] = startTime.split(':');
    const startHour = parseInt(startHourStr || '0', 10);
    const startMinute = parseInt(startMinuteStr || '0', 10);

    // Buat objek Date waktu mulai sesi
    // Format sessionDate: "YYYY-MM-DD"
    const [year, month, day] = sessionDate.split('-').map((v) => parseInt(v, 10));
    const sessionStartDate = new Date(year, month - 1, day, startHour, startMinute, 0, 0);

    // Waktu buka absensi: openBeforeMinutes sebelum sesi
    const windowStart = new Date(sessionStartDate.getTime() - openBeforeMinutes * 60 * 1000);

    // Waktu tutup absensi standar: closeAfterHours jam setelah waktu mulai
    // Ditambah toleransi hari maxDaysAllowed jika dikonfigurasi
    let windowEnd = new Date(sessionStartDate.getTime() + closeAfterHours * 60 * 60 * 1000);

    if (maxDaysAllowed > 0) {
      // Perpanjang s/d H+maxDaysAllowed pukul 23:59:59
      const endOfAllowedDay = new Date(year, month - 1, day + maxDaysAllowed, 23, 59, 59, 999);
      if (endOfAllowedDay.getTime() > windowEnd.getTime()) {
        windowEnd = endOfAllowedDay;
      }
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateTime = (d: Date) => {
      const isSameDate =
        d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      if (isSameDate) return timeStr;
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${timeStr}`;
    };

    const windowStartFormatted = formatDateTime(windowStart);
    const windowEndFormatted = formatDateTime(windowEnd);

    const currentTime = currentDate.getTime();

    // 1. Sebelum jam buka presensi
    if (currentTime < windowStart.getTime()) {
      return {
        isAllowed: false,
        status: 'too_early',
        windowStart: windowStartFormatted,
        windowEnd: windowEndFormatted,
        message: `Presensi belum dibuka. Presensi dibuka mulai ${windowStartFormatted} (${openBeforeMinutes} menit sebelum jadwal mulai).`,
      };
    }

    // 2. Melewati batas akhir jendela presensi
    if (currentTime > windowEnd.getTime()) {
      return {
        isAllowed: false,
        status: 'expired',
        windowStart: windowStartFormatted,
        windowEnd: windowEndFormatted,
        message: `Batas waktu pengisian presensi telah berakhir pada ${windowEndFormatted}. Silakan ajukan perpanjangan/dispensasi ke manajemen.`,
      };
    }

    // 3. Sedang dalam rentang waktu yang diizinkan
    return {
      isAllowed: true,
      status: 'open',
      windowStart: windowStartFormatted,
      windowEnd: windowEndFormatted,
      message: `Waktu presensi dibuka (${windowStartFormatted} s/d ${windowEndFormatted}).`,
    };
  } catch {
    return {
      isAllowed: true,
      status: 'open',
      windowStart: startTime,
      windowEnd: 'Toleransi Waktu Aktif',
      message: 'Waktu presensi aktif.',
    };
  }
}
