"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteStudent } from "../actions/student.actions";

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
  studentCode?: string;
}

export function DeleteStudentButton({
  studentId,
  studentName,
  studentCode,
}: DeleteStudentButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteStudent(studentId);
        if (!res.success) {
          toast.error(res.error || "Gagal menghapus data murid.");
          return;
        }

        toast.success(res.message || "Data murid berhasil dihapus.");
        setOpen(false);
        router.push("/management/students");
        router.refresh();
      } catch (err: unknown) {
        console.error("Error deleting student:", err);
        toast.error("Terjadi kesalahan saat menghapus data murid.");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 shadow-xs"
          />
        }
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Hapus Murid
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            Hapus Data Murid
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-sm leading-relaxed mt-2">
            Apakah Anda yakin ingin menghapus data murid{" "}
            <strong className="text-foreground">{studentName}</strong>
            {studentCode ? ` (NIS: ${studentCode})` : ""}?
            <br />
            <br />
            <span className="text-destructive/90 font-medium">
              Peringatan: Tindakan ini permanen. Seluruh histori kehadiran, pendaftaran paket belajar, dan catatan pembelajaran murid ini akan dihapus dari sistem.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Murid
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
