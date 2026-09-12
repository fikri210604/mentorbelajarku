"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AttendanceForm } from "./AttendanceForm";

interface TutorAttendancePageProps {
  todaySessions?: any[];
  currentUser?: {
    id: string;
    role: "tutor" | "management" | "admin" | "finance";
    tutorId: string | null;
  };
}

export default function TutorAttendancePage({
  todaySessions = [],
  currentUser = { id: "user-default", role: "tutor", tutorId: null },
}: TutorAttendancePageProps) {
  const [selectedSession, setSelectedSession] = useState<any | null>(
    todaySessions.length > 0 ? todaySessions[0] : null
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Presensi Kelas"
        description="Ambil foto kehadiran murid dan catat materi pembelajaran yang diberikan."
      />

      {todaySessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Tidak ada jadwal sesi belajar hari ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pilih Sesi Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaySessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedSession?.id === session.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">{session.programs?.name || "Bimbel"}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)} • {session.bimbel_types?.name}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedSession && (
            <AttendanceForm
              sessionId={selectedSession.id}
              sessionDetails={{
                date: selectedSession.session_date || new Date().toISOString().split("T")[0],
                programName: selectedSession.programs?.name || "Program Bimbel",
                bimbelTypeName: selectedSession.bimbel_types?.name || "Reguler",
                duration: selectedSession.bimbel_types?.duration_minutes || 60,
                tutorName: selectedSession.tutors?.profiles?.full_name || "Tutor Pengajar",
                startTime: selectedSession.start_time || "16:00",
                endTime: selectedSession.end_time || "17:15",
              }}
              students={
                selectedSession.students && selectedSession.students.length > 0
                  ? selectedSession.students
                  : [
                      { id: "std-001", name: "Alghazy Malik", student_code: "STD-2026-001" },
                      { id: "std-002", name: "Najwa Khairunnisa", student_code: "STD-2026-002" },
                      { id: "std-003", name: "Dimas Prasetyo", student_code: "STD-2026-003" },
                    ]
              }
              currentUser={currentUser}
            />
          )}
        </div>
      )}
    </div>
  );
}
