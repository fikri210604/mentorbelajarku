import { Clock, User, BookOpen, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentMeetingHistoryItem } from '../types';

interface StudentHistoryListProps {
  history: StudentMeetingHistoryItem[];
  title?: string;
  description?: string;
}

export function StudentHistoryList({
  history,
  title = 'Riwayat Sesi Pembelajaran & Pertemuan',
  description = 'Daftar pertemuan riil yang telah terlaksana beserta nomor urut pertemuan dan tutor pengajar.',
}: StudentHistoryListProps) {
  if (history.length === 0) {
    return (
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
            <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
            <p>Belum ada catatan pertemuan untuk murid ini.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (item: StudentMeetingHistoryItem) => {
    switch (item.status) {
      case 'present':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-xs">
            Hadir
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-300 dark:bg-orange-950 dark:text-orange-300 font-semibold text-xs">
            Terlambat
          </Badge>
        );
      case 'permission':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-semibold text-xs">
            Izin (Kuota Utuh)
          </Badge>
        );
      case 'sick':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-semibold text-xs">
            Sakit (Kuota Utuh)
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-300 dark:bg-rose-950 dark:text-rose-300 font-semibold text-xs">
            Alpa
          </Badge>
        );
      default:
        return <Badge variant="outline">{item.status}</Badge>;
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {history.length} Catatan Sesi
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y border-t">
          {history.map((item) => {
            const hasMeetingNumber = item.meetingNumber !== null;

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-muted/10 transition-colors"
              >
                {/* Kolom Kiri: Badge Pertemuan + Info Tanggal + Tutor */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {hasMeetingNumber ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-primary text-primary-foreground shadow-xs tracking-wide">
                        <span>P{item.meetingNumber}</span>
                        <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
                          (Pertemuan {item.meetingNumber})
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border">
                        Non-Pertemuan
                      </span>
                    )}

                    <span className="font-semibold text-sm text-foreground">
                      {item.sessionDate}
                    </span>

                    {item.startTime && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({item.startTime.slice(0, 5)} - {item.endTime?.slice(0, 5) || ''})
                      </span>
                    )}

                    {getStatusBadge(item)}
                  </div>

                  {/* Tutor Pengajar */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Tutor Pengajar: </span>
                    <strong className="text-foreground">{item.tutorName}</strong>
                  </div>

                  {/* Materi Pembelajaran */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-start gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="font-medium text-foreground">
                        {item.material || 'Materi belum diinput'}
                      </span>
                    </div>

                    {/* Catatan / Alasan Izin */}
                    {item.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Catatan: {item.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
