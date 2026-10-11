"use client";

import React from "react";
import { ReportBanner } from "@/components/shared/report-banner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EvaluationRowItem {
  id: string;
  dateStr: string;
  material: string;
  meetingNumber: number | string;
  tutorName: string;
  notes?: string;
}

interface PrintableEvaluationSheetProps {
  studentName: string;
  rows: EvaluationRowItem[];
  isEditing?: boolean;
  onUpdateRow?: (index: number, updated: Partial<EvaluationRowItem>) => void;
  onEditRow?: (row: EvaluationRowItem, index: number) => void;
}

export function PrintableEvaluationSheet({
  studentName,
  rows,
  isEditing = false,
  onUpdateRow,
  onEditRow,
}: PrintableEvaluationSheetProps) {
  const showActionColumn = !!onEditRow;

  return (
    <div className="printable-sheet bg-white text-slate-900 p-4 sm:p-8 rounded-sm shadow-md border border-slate-200 max-w-[210mm] mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* 1. KOP BANNER SURAT RESMI */}
      <ReportBanner />

      {/* 2. JUDUL DOKUMEN */}
      <div className="text-center py-4">
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 uppercase">
          Laporan Perkembangan Murid Bimbel
        </h2>
      </div>

      {/* 3. IDENTITAS MURID */}
      <div className="flex items-center gap-2 pb-3 text-sm sm:text-base font-bold text-slate-900">
        <span>Nama Murid :</span>
        <span className="font-semibold">{studentName || "-"}</span>
      </div>

      {/* 4. TABEL REKAPITULASI SESI & MATERI */}
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border-2 border-slate-800 text-xs sm:text-sm font-sans">
          <thead>
            <tr className="bg-[#9bbad6] text-slate-900 border-b-2 border-slate-800">
              <th className="border border-slate-800 px-3 py-2.5 font-bold text-center w-[20%]">
                Hari, tgl
              </th>
              <th className="border border-slate-800 px-4 py-2.5 font-bold text-center w-[46%]">
                Materi yang diajarkan
              </th>
              <th className="border border-slate-800 px-2 py-2.5 font-bold text-center w-[12%]">
                Pertemuan ke
              </th>
              <th className="border border-slate-800 px-3 py-2.5 font-bold text-center w-[16%]">
                Mentor yang Mengajar
              </th>
              {showActionColumn && (
                <th className="border border-slate-800 px-2 py-2.5 font-bold text-center w-[65px] print:hidden">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showActionColumn ? 5 : 4}
                  className="border border-slate-800 p-8 text-center text-slate-500 italic"
                >
                  Belum ada rekaman sesi pembelajaran yang tercatat untuk murid
                  ini.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-800"
                >
                  {/* Hari, tgl */}
                  <td className="border border-slate-800 px-3 py-2 text-slate-800 align-top">
                    {isEditing ? (
                      <Input
                        value={row.dateStr}
                        onChange={(e) =>
                          onUpdateRow?.(idx, { dateStr: e.target.value })
                        }
                        className="h-7 text-xs bg-white text-slate-900 border-slate-300"
                        placeholder="Contoh: Kamis, 2/10/25"
                      />
                    ) : (
                      <span className="font-medium">{row.dateStr}</span>
                    )}
                  </td>

                  {/* Materi yang diajarkan & Keterangan */}
                  <td className="border border-slate-800 px-3 py-2 text-slate-900 align-top">
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <Textarea
                          value={row.material}
                          onChange={(e) =>
                            onUpdateRow?.(idx, { material: e.target.value })
                          }
                          rows={2}
                          className="text-xs bg-white text-slate-900 border-slate-300 min-h-[44px]"
                          placeholder="Materi yang diajarkan..."
                        />
                        <Input
                          value={row.notes || ""}
                          onChange={(e) =>
                            onUpdateRow?.(idx, { notes: e.target.value })
                          }
                          className="h-7 text-xs bg-white text-slate-900 border-slate-300"
                          placeholder="Keterangan / catatan..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="leading-snug font-medium text-slate-900">
                          {row.material || (
                            <span className="text-slate-400 italic text-xs">
                              Belum ada materi
                            </span>
                          )}
                        </p>
                        {row.notes && (
                          <p className="text-[11px] text-slate-600 leading-tight">
                            <span className="font-semibold text-slate-700">
                              Keterangan:
                            </span>{" "}
                            {row.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Pertemuan ke */}
                  <td className="border border-slate-800 px-2 py-2 text-center font-bold text-slate-900 align-top">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={row.meetingNumber}
                        onChange={(e) =>
                          onUpdateRow?.(idx, { meetingNumber: e.target.value })
                        }
                        className="h-7 text-xs text-center bg-white text-slate-900 border-slate-300 w-16 mx-auto"
                      />
                    ) : (
                      <span>{row.meetingNumber}</span>
                    )}
                  </td>

                  {/* Mentor yang Mengajar */}
                  <td className="border border-slate-800 px-3 py-2 text-slate-800 align-top">
                    {isEditing ? (
                      <Input
                        value={row.tutorName}
                        onChange={(e) =>
                          onUpdateRow?.(idx, { tutorName: e.target.value })
                        }
                        className="h-7 text-xs bg-white text-slate-900 border-slate-300"
                        placeholder="Nama Tutor"
                      />
                    ) : (
                      <span className="font-medium capitalize">
                        {row.tutorName || "-"}
                      </span>
                    )}
                  </td>

                  {/* Kolom Aksi (Hanya tombol Edit untuk popup keterangan, tanpa tombol hapus, disembunyikan saat cetak) */}
                  {showActionColumn && (
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center align-middle print:hidden">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => onEditRow(row, idx)}
                        className="h-7 px-2.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 gap-1 shadow-2xs"
                        title="Edit keterangan dan materi pertemuan ini"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. FOOTER RESMI CETAKAN LAPORAN (Keterangan & Tanda Tangan) */}
      <div className="pt-6 flex justify-between items-end text-xs text-slate-600 print:pt-8">
        <div className="space-y-1">
          <p className="italic text-[11px] text-slate-500">
            * Laporan ini digenerate resmi dari sistem absensi dan materi Bimbel
            Mentorbelajarku.
          </p>
        </div>
        <div className="text-center pr-4 space-y-12">
          <p className="font-medium text-slate-800">
            Manajemen Mentorbelajarku,
          </p>
          <div className="w-32 border-b border-slate-800 mx-auto" />
        </div>
      </div>
    </div>
  );
}
