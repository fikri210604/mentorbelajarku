'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { loginWithSyntheticUser } from '@/features/auth/actions/auth.actions';
import { SYNTHETIC_USERS, SyntheticUser, DEFAULT_SYNTHETIC_USER } from '@/data/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  KeyRound,
  Sparkles,
  Lock,
  Mail,
  Info,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [activeTab, setActiveTab] = useState<'real' | 'demo'>('real');
  const [realEmail, setRealEmail] = useState('');
  const [realPassword, setRealPassword] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(DEFAULT_SYNTHETIC_USER.email);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get('logged_out') === 'true') {
      setLoggedOutNotice(true);
      // Bersihkan parameter ?logged_out=true dari address bar browser tanpa reload
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  // Login dengan Better Auth Asli (Email & Password)
  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realEmail || !realPassword) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: realEmail,
        password: realPassword,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Email atau kata sandi salah.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Berhasil masuk! Mengarahkan ke dashboard...');

      // Hapus cookie sintesis agar session Better Auth murni yang aktif
      document.cookie = 'synthetic_user_id=; path=/; max-age=0;';

      const targetUrl = callbackUrl || '/management/dashboard';
      window.location.href = targetUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk.';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  // Login dengan Akun Sintetis (Mode Uji Coba)
  const performLogin = async (userOrEmail: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await loginWithSyntheticUser(userOrEmail);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Akun tidak ditemukan dalam daftar user sintetis.');
        setLoading(false);
        return;
      }

      // Set cookie di sisi client juga untuk sinkronisasi seketika
      document.cookie = `synthetic_user_id=${result.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `better-auth.session_token=synthetic-${result.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      setSuccessMsg(`Berhasil masuk sebagai ${result.user.name} (${result.user.role})! Mengarahkan ke dashboard...`);

      const isTargetingManagement = callbackUrl?.startsWith('/management');
      const isTargetingTutor = callbackUrl?.startsWith('/tutor');

      let targetUrl = result.redirectTo;
      if (callbackUrl && !callbackUrl.startsWith('/login')) {
        if (result.user.role === 'tutor' && !isTargetingManagement) {
          targetUrl = callbackUrl;
        } else if (
          (result.user.role === 'management' || result.user.role === 'admin') &&
          !isTargetingTutor
        ) {
          targetUrl = callbackUrl;
        }
      }

      window.location.href = targetUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat login sintetis.';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = selectedEmail.trim() || DEFAULT_SYNTHETIC_USER.email;
    performLogin(emailToUse);
  };

  const handleQuickSelect = (user: SyntheticUser) => {
    setSelectedEmail(user.email);
    performLogin(user.id);
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

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mt-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('real');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'real'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Akun Asli (Better Auth)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Mode Uji Coba (Demo)
            </button>
          </div>
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

          {activeTab === 'real' ? (
            /* =================== TAB 1: REAL BETTER AUTH LOGIN =================== */
            <div className="space-y-4">
              <form onSubmit={handleRealLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="realEmail">Email Terdaftar</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="realEmail"
                      type="email"
                      placeholder="nama@email.com"
                      value={realEmail}
                      onChange={(e) => setRealEmail(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="realPassword">Kata Sandi</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="realPassword"
                      type="password"
                      placeholder="••••••••"
                      value={realPassword}
                      onChange={(e) => setRealPassword(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    'Masuk dengan Akun Asli'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* =================== TAB 2: DEMO / SYNTHETIC USERS =================== */
            <div className="space-y-4">
              {/* Banner Informasi Mode Sintetis */}
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Mode Uji Coba:</strong> Pilih akun di bawah untuk langsung mencoba alur tanpa kata sandi database.
                </span>
              </div>

              {/* Quick Click Synthetic Users */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pilih Akun Sintetis (1-Klik):
                </Label>
                <div className="grid gap-2">
                  {SYNTHETIC_USERS.map((u) => {
                    const isTutor = u.role === 'tutor';
                    const isMgmt = u.role === 'management';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickSelect(u)}
                        className="flex items-center justify-between p-2.5 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors text-left group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium leading-none truncate group-hover:text-primary">
                              {u.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 capitalize shrink-0 ${
                            isMgmt
                              ? u.subrole === 'hrd'
                                ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'
                                : u.subrole === 'finance'
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300'
                              : isTutor
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-slate-300'
                          }`}
                        >
                          {u.role}{u.subrole ? ` • ${u.subrole}` : ''}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">atau ketik email sintetis</span>
                </div>
              </div>

              {/* Form Input Email (Tanpa Password) */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demoEmail">Email Sintetis</Label>
                  <Input
                    id="demoEmail"
                    type="email"
                    placeholder="misal: management@mentorbelajarku.com"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Masuk...
                    </>
                  ) : (
                    'Masuk Tanpa Password'
                  )}
                </Button>
              </form>
            </div>
          )}
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
