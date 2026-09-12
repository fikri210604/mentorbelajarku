import Link from "next/link";
import { ArrowLeft, Coins, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { TutorWithProfile } from "../types";

interface TutorDetailPageProps {
  tutor: TutorWithProfile | null;
}

export default function TutorDetailPage({ tutor }: TutorDetailPageProps) {
  if (!tutor) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Tutor tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/management/tutors">Kembali ke Daftar Tutor</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tutor.profiles?.full_name || "Detail Tutor"}
        description={`Status: ${tutor.status} • Kontak: ${tutor.profiles?.phone || "-"}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/tutors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Nama Lengkap</span>
              <span className="font-medium">{tutor.profiles?.full_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Nomor Telepon</span>
              <span className="font-medium">{tutor.profiles?.phone || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Bio / Catatan</span>
              <span className="font-medium">{tutor.bio || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Konfigurasi Tarif Honor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tutor.rates && tutor.rates.length > 0 ? (
              <div className="space-y-2">
                {tutor.rates.map((rate) => (
                  <div key={rate.id} className="p-3 border rounded flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{rate.bimbel_types?.name || "Tipe Bimbel"}</p>
                      <p className="text-xs text-muted-foreground">Berlaku sejak: {rate.effective_from}</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(Number(rate.rate_per_student))} / murid
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada tarif khusus yang diatur.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
