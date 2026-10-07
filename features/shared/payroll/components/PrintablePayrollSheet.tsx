import { ReportBanner } from "@/components/shared/report-banner";
import { formatCurrency } from "@/lib/utils";
import type { PayrollHonorSummary, PayrollSheetRow } from "../types";

interface PrintablePayrollSheetProps {
  tutorName: string;
  monthLabel: string;
  rows: PayrollSheetRow[];
  summary?: PayrollHonorSummary | null;
}

function meetingLabel(row: PayrollSheetRow): string {
  if (row.meetingCode) return row.meetingCode;
  if (row.meetingNumber) return `P${row.meetingNumber}`;
  return "-";
}

/**
 * Sheet penggajian tutor (A4) dengan format resmi seperti Laporan Perkembangan Murid.
 * Kolom: No, Hari/tgl, Nama Murid, Pertemuan ke + rekap honor di bagian bawah.
 */
export function PrintablePayrollSheet({
  tutorName,
  monthLabel,
  rows,
  summary,
}: PrintablePayrollSheetProps) {
  return (
    <div className="printable-sheet bg-white text-slate-900 p-4 sm:p-8 rounded-sm shadow-md border border-slate-200 max-w-[210mm] mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* 1. KOP BANNER SURAT RESMI */}
      <ReportBanner />

      {/* 2. JUDUL DOKUMEN */}
      <div className="text-center py-4">
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 uppercase">
          Daftar Penggajian Tutor Bimbel
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Periode: <span className="font-semibold text-slate-800">{monthLabel}</span>
        </p>
      </div>

      {/* 3. IDENTITAS TUTOR */}
      <div className="flex items-center gap-2 pb-3 text-sm sm:text-base font-bold text-slate-900">
        <span>Nama Mentor :</span>
        <span className="font-semibold">{tutorName || "-"}</span>
      </div>

      {/* 4. TABEL REKAPITULASI PRESENSI MENGAJAR */}
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border-2 border-slate-800 text-xs sm:text-sm font-sans">
          <thead>
            <tr className="bg-[#9bbad6] text-slate-900 border-b-2 border-slate-800">
              <th className="border border-slate-800 px-2 py-2.5 font-bold text-center w-[8%]">
                No.
              </th>
              <th className="border border-slate-800 px-3 py-2.5 font-bold text-center w-[38%]">
                Hari, tgl
              </th>
              <th className="border border-slate-800 px-4 py-2.5 font-bold text-center w-[34%]">
                Nama Murid
              </th>
              <th className="border border-slate-800 px-2 py-2.5 font-bold text-center w-[20%]">
                Pertemuan ke
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="border border-slate-800 p-8 text-center text-slate-500 italic"
                >
                  Belum ada rekaman presensi mengajar pada periode ini.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.attendanceId || idx}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-800"
                >
                  <td className="border border-slate-800 px-2 py-2 text-center text-slate-700 align-top">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-800 px-3 py-2 text-slate-800 align-top">
                    <span className="font-medium">{row.dateStr}</span>
                    {row.startTime && (
                      <span className="block text-[11px] text-slate-500">
                        {row.startTime.slice(0, 5)}
                        {row.endTime ? `-${row.endTime.slice(0, 5)}` : ""} WIB
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-800 px-4 py-2 text-slate-900 align-top">
                    <span className="font-medium">{row.studentName}</span>
                    <span className="block text-[11px] text-slate-500 font-mono">
                      {row.studentCode}
                    </span>
                  </td>
                  <td className="border border-slate-800 px-2 py-2 text-center font-bold text-slate-900 align-top">
                    {meetingLabel(row)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. REKAP HONOR */}
      {summary && (
        <div className="pt-4 space-y-2">
          {!summary.configured ? (
            <p className="text-xs italic text-amber-700 border border-amber-300 bg-amber-50 rounded-sm px-3 py-2">
              Tarif honor untuk periode ini belum diatur manajemen, sehingga total honor belum dapat
              dihitung.
            </p>
          ) : (
            <div className="flex justify-end">
              <table className="border-collapse border-2 border-slate-800 text-xs sm:text-sm">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 px-3 py-1.5 text-slate-700">
                      Total Pertemuan Efektif
                    </td>
                    <td className="border border-slate-800 px-3 py-1.5 text-center font-semibold w-24">
                      {summary.totalSessions}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 px-3 py-1.5 text-slate-700">
                      Total Murid Terhitung
                    </td>
                    <td className="border border-slate-800 px-3 py-1.5 text-center font-semibold">
                      {summary.totalPayableStudents}
                    </td>
                  </tr>
                  {summary.breakdown.length > 1 &&
                    summary.breakdown.map((b) => (
                      <tr key={b.bimbelTypeName}>
                        <td className="border border-slate-800 px-3 py-1.5 text-slate-700">
                          {b.bimbelTypeName} · {formatCurrency(b.rate)} × {b.count}
                        </td>
                        <td className="border border-slate-800 px-3 py-1.5 text-right font-medium">
                          {formatCurrency(b.subtotal)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-[#9bbad6]">
                    <td className="border border-slate-800 px-3 py-2 font-bold text-slate-900">
                      Total Honor
                    </td>
                    <td className="border border-slate-800 px-3 py-2 text-right font-bold text-slate-900">
                      {formatCurrency(summary.grossAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. FOOTER RESMI CETAKAN (Keterangan & Tanda Tangan) */}
      <div className="pt-6 flex justify-between items-end text-xs text-slate-600 print:pt-8">
        <div className="space-y-1">
          <p className="italic text-[11px] text-slate-500">
            * Dokumen ini digenerate resmi dari sistem presensi dan penggajian Bimbel Mentorbelajarku.
          </p>
        </div>
        <div className="text-center pr-4 space-y-12">
          <p className="font-medium text-slate-800">Manajemen Mentorbelajarku,</p>
          <div className="w-32 border-b border-slate-800 mx-auto" />
        </div>
      </div>
    </div>
  );
}
