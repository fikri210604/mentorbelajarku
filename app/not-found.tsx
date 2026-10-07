"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background px-4">
      <Card className="max-w-2xl w-full shadow-xs border-border/80">
        <CardHeader className="text-center pt-8">
          <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center mb-6">
            <span className="text-5xl">:(</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">404 - Halaman Tidak Ditemukan</CardTitle>
          <CardDescription className="text-base mt-2 max-w-md mx-auto">
            Maaf, halaman yang Anda cari kemungkinan telah dipindahkan atau tidak lagi tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="border-border/80 hover:border-primary/40 transition-colors duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dashboard</CardTitle>
                <CardDescription className="text-xs">
                  Kembali ke halaman utama sesuai peran Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => router.push("/dashboard")}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ke Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 hover:border-primary/40 transition-colors duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Laporan</CardTitle>
                <CardDescription className="text-xs">
                  Lihat semua laporan absensi dan honor per periode.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => router.push("/tutor/payroll")}
                >
                  <span className="w-4 h-4 mr-2 text-center">Rp</span>
                  Ke Penggajian
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-xs">
              Kembali ke halaman sebelumnya
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
