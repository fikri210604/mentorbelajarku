/** Util format & rentang bulan yang aman dipakai di client maupun server. */

const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Normalisasi tanggal ke kunci bulan `YYYY-MM`. */
export function toMonthKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Rentang tanggal awal & akhir sebuah bulan `YYYY-MM`. */
export function monthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/** Label bulan Indonesia, contoh: "September 2026". */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

/** Format tanggal gaya laporan, contoh: "Senin, 2/10/26". */
export function formatIndonesianReportDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return `${ID_DAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${String(
      d.getFullYear()
    ).slice(-2)}`;
  } catch {
    return dateStr;
  }
}

/** Daftar kunci bulan `YYYY-MM` dari `fromMonth` sampai `toMonth` (inklusif, terbaru dulu). */
export function monthsBetween(fromMonth: string, toMonth: string): string[] {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  const months: string[] = [];
  let year = fy;
  let month = fm;
  while (year < ty || (year === ty && month <= tm)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (months.length > 240) break;
  }
  return months.reverse();
}
