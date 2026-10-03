"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  User,
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Eye,
  BookMarked,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LearningRecordWithDetails } from "@/features/shared/learning-records/queries/learning-record.queries";

interface LearningRecordsPageProps {
  initialRecords?: LearningRecordWithDetails[];
}

export default function LearningRecordsPage({ initialRecords = [] }: LearningRecordsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRecord, setActiveRecord] = useState<LearningRecordWithDetails | null>(null);

  const filteredRecords = useMemo(() => {
    return initialRecords.filter((rec) => {
      const matchSearch =
        searchTerm === "" ||
        rec.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.homework && rec.homework.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.students?.name && rec.students.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.students?.student_code && rec.students.student_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.tutors?.profiles?.full_name && rec.tutors.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSearch;
    });
  }, [initialRecords, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jurnal & Catatan Belajar Murid"
        description="Rekapitulasi materi pembelajaran, catatan perkembangan, dan pekerjaan rumah (PR) per sesi belajar."
      />

      {/* Filter & Search Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari materi, murid, atau tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
            <div className="text-xs text-muted-foreground self-start sm:self-center">
              Total <strong>{filteredRecords.length}</strong> catatan pembelajaran
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table / Cards */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-primary" />
            Daftar Jurnal Materi Pembelajaran
          </CardTitle>
          <CardDescription className="text-xs">
            Dicatat langsung oleh tutor saat pengisian absensi dan bukti mengajar di kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium">Belum ada catatan materi pembelajaran.</p>
              <p className="text-xs">Jurnal akan terisi otomatis saat tutor menyelesaikan sesi dan menginput materi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Murid</th>
                    <th className="px-4 py-2.5">Tutor</th>
                    <th className="px-4 py-2.5">Materi yang Dipelajari</th>
                    <th className="px-4 py-2.5">Tugas / PR</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((rec) => {
                    const session = rec.attendance?.sessions;
                    const dateStr = session?.session_date || rec.created_at.split("T")[0];

                    return (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                          {dateStr}
                          {session?.programs && (
                            <span className="text-[11px] text-muted-foreground block">
                              {session.programs.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-foreground text-xs block">
                            {rec.students?.name || "Murid"}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {rec.students?.student_code || "-"} · {rec.students?.grade || ""}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-foreground">
                          {rec.tutors?.profiles?.full_name || "Tutor"}
                        </td>
                        <td className="px-4 py-2.5 max-w-xs">
                          <p className="text-xs text-foreground font-medium line-clamp-2">
                            {rec.material}
                          </p>
                          {rec.notes && (
                            <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">
                              Catatan: {rec.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs">
                          {rec.homework ? (
                            <span className="line-clamp-1 font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                              {rec.homework}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveRecord(rec)}
                            className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Jurnal Modal */}
      <Dialog open={!!activeRecord} onOpenChange={(open) => !open && setActiveRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Detail Jurnal Pembelajaran
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tanggal Sesi: {activeRecord?.attendance?.sessions?.session_date || "-"}
            </DialogDescription>
          </DialogHeader>

          {activeRecord && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg border bg-muted/30">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Murid:</span>
                  <strong className="text-foreground text-xs">{activeRecord.students?.name}</strong>
                  <span className="text-muted-foreground block text-[11px]">
                    NIS: {activeRecord.students?.student_code}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Tutor Pengajar:</span>
                  <strong className="text-foreground text-xs">
                    {activeRecord.tutors?.profiles?.full_name || "Tutor"}
                  </strong>
                  <span className="text-muted-foreground block text-[11px]">
                    {activeRecord.attendance?.sessions?.programs?.name || "Bimbel"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground block">Materi Pembelajaran:</span>
                <p className="p-2.5 bg-muted/50 rounded border text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {activeRecord.material}
                </p>
              </div>

              {activeRecord.notes && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">Catatan Perkembangan:</span>
                  <p className="p-2.5 bg-muted/50 rounded border text-xs text-muted-foreground leading-relaxed">
                    {activeRecord.notes}
                  </p>
                </div>
              )}

              {activeRecord.homework && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">PR / Tugas Rumah:</span>
                  <p className="p-2.5 bg-primary/5 rounded border border-primary/20 text-xs text-foreground font-mono">
                    {activeRecord.homework}
                  </p>
                </div>
              )}

              {activeRecord.attendance?.photo_path && (
                <div className="space-y-1 pt-1 border-t border-border/50">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    Bukti Foto Pertemuan:
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate block">
                    {activeRecord.attendance.photo_path}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
