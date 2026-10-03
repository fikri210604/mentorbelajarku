'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Lock, Mail, Info, Eye, EyeOff } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const loggedOutNotice = searchParams.get('logged_out') === 'true';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({ email, password });

      if (res.error) {
        setErrorMsg(res.error.message || 'Email atau kata sandi salah.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Berhasil masuk! Mengarahkan ke dashboard...');
      const targetUrl =
        callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard';
      window.location.href = targetUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk.';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] max-w-lg items-center justify-center px-4 py-10">
      <Card className="w-full shadow-lg border">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-border shadow-xs p-2 mb-2 overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="Mentor Belajarku Logo"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            Mentor Belajarku
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Portal Manajemen & Sistem Presensi Bimbingan Belajar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {loggedOutNotice && (
            <Alert className="py-2.5 border-blue-500/40 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <AlertDescription className="text-xs sm:text-sm">
                Anda telah keluar (logout) dari sesi sebelumnya. Silakan masukkan email dan kata sandi Anda untuk masuk kembali.
              </AlertDescription>
            </Alert>
          )}

          {errorMsg && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert className="py-2.5 border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-sm">{successMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Terdaftar</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
