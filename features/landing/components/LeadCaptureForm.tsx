'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function LeadCaptureForm() {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'SMA (Kelas 10-12 / UTBK)',
    program: 'Intensif',
    phone: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    // Create WhatsApp link
    const text = `Halo Admin Mentor Belajarku, saya ingin konsultasi belajar dan klaim asesmen gratis untuk:
- Nama: ${formData.name}
- Jenjang: ${formData.grade}
- Minat Program: Kelas ${formData.program}
- No. WhatsApp: ${formData.phone}`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/6281234567890?text=${encodedText}`;

    setIsSubmitted(true);
    // Open WhatsApp in new tab
    window.open(waUrl, '_blank');
  };

  return (
    <Card id="konsultasi" className="relative overflow-hidden border-2 border-primary/20 shadow-xl bg-card/95 backdrop-blur-sm">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Kuota Terbatas
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">Asesmen 100% Gratis</span>
        </div>
        <CardTitle className="text-xl font-bold text-foreground mt-2">
          Konsultasi & Tes Diagnostik
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Petakan kelemahan belajar anak dan dapatkan rekomendasi program yang paling tepat.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-foreground text-base">Permintaan Terkirim!</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Membuka WhatsApp Admin Mentor Belajarku. Tim akademik kami akan segera menjadwalkan tes diagnostik gratis Anda.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitted(false)}
              className="mt-2 text-xs"
            >
              Kirim Konsultasi Lainnya
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name" className="text-xs font-semibold">
                Nama Lengkap Siswa / Orang Tua
              </Label>
              <Input
                id="lead-name"
                placeholder="Contoh: Budi Santoso / Ibu Dian"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lead-grade" className="text-xs font-semibold">
                  Jenjang Pendidikan
                </Label>
                <select
                  id="lead-grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="SD (Kelas 4-6)">SD (Kelas 4-6)</option>
                  <option value="SMP (Kelas 7-9)">SMP (Kelas 7-9)</option>
                  <option value="SMA (Kelas 10-12 / UTBK)">SMA (Kelas 10-12 / UTBK)</option>
                  <option value="Alumni / Gap Year">Alumni / Gap Year</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead-program" className="text-xs font-semibold">
                  Pilihan Kelas
                </Label>
                <select
                  id="lead-program"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Reguler">Kelas Reguler (60m)</option>
                  <option value="Intensif">Kelas Intensif (75m)</option>
                  <option value="Private">Kelas Private 1-on-1 (90m)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-phone" className="text-xs font-semibold">
                Nomor WhatsApp Aktif
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                placeholder="0812xxxxxxx"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <Button type="submit" className="w-full h-10 font-bold gap-2 text-sm shadow-md mt-2">
              Klaim Tes Diagnostik Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Privasi data terjaga. Bebas biaya konsultasi.</span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
