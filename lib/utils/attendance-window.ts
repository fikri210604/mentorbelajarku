export interface AttendanceTimeWindowResult {
  isAllowed: boolean;
  status: 'too_early' | 'open' | 'expired';
  windowStart: string;
  windowEnd: string;
  message: string;
}

/**
 * Validasi Jendela Waktu Presensi:
 * Presensi HANYA dapat dilakukan mulai dari jam mulai mengajar (start_time)
 * hingga 2 jam kemudian.
 *
 * Contoh:
 * Jam Mengajar: 16:00 - 17:15
 * Jendela Presensi: 16:00 - 18:00 (Mulai jam 16:00 s/d 18:00)
 */
export function validateAttendanceTimeWindow(
  sessionDate: string,
  startTime: string,
  currentDate: Date = new Date()
): AttendanceTimeWindowResult {
  try {
    const [startHourStr, startMinuteStr] = startTime.split(':');
    const startHour = parseInt(startHourStr || '0', 10);
    const startMinute = parseInt(startMinuteStr || '0', 10);

    // Buat objek Date waktu mulai absensi
    const windowStart = new Date(sessionDate);
    windowStart.setHours(startHour, startMinute, 0, 0);

    // Batas akhir absensi: 2 jam setelah jam mulai
    const windowEnd = new Date(windowStart);
    windowEnd.setHours(windowEnd.getHours() + 2);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const windowStartFormatted = formatTime(windowStart);
    const windowEndFormatted = formatTime(windowEnd);

    const currentTime = currentDate.getTime();

    // 1. Sebelum jam mengajar dimulai
    if (currentTime < windowStart.getTime()) {
      return {
        isAllowed: false,
        status: 'too_early',
        windowStart: windowStartFormatted,
        windowEnd: windowEndFormatted,
        message: `Presensi belum dibuka. Presensi dibuka mulai jam mengajar (${windowStartFormatted}) hingga 2 jam kemudian (${windowEndFormatted}).`,
      };
    }

    // 2. Lebih dari 2 jam setelah jam mengajar dimulai
    if (currentTime > windowEnd.getTime()) {
      return {
        isAllowed: false,
        status: 'expired',
        windowStart: windowStartFormatted,
        windowEnd: windowEndFormatted,
        message: `Batas waktu presensi telah berakhir (${windowEndFormatted}). Presensi maksimal 2 jam setelah jam mulai mengajar (${windowStartFormatted}).`,
      };
    }

    // 3. Sedang dalam rentang waktu yang diizinkan
    return {
      isAllowed: true,
      status: 'open',
      windowStart: windowStartFormatted,
      windowEnd: windowEndFormatted,
      message: `Waktu presensi dibuka (${windowStartFormatted} - ${windowEndFormatted}).`,
    };
  } catch (err) {
    return {
      isAllowed: true,
      status: 'open',
      windowStart: startTime,
      windowEnd: '2 Jam Kemudian',
      message: 'Waktu presensi aktif.',
    };
  }
}
