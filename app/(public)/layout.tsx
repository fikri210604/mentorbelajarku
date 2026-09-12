import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span>MentorBelajarku</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/" className="transition hover:text-foreground">
              Beranda
            </Link>
            <Link href="#features" className="transition hover:text-foreground">
              Fitur
            </Link>
            <Link href="#programs" className="transition hover:text-foreground">
              Layanan Bimbel
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8 sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
              M
            </div>
            <span className="font-semibold text-foreground">MentorBelajarku</span>
            <span>&copy; {new Date().getFullYear()} Bimbel Management System.</span>
          </div>
          <p className="text-xs">
            Sistem Absensi, Sesi Belajar, dan Manajemen Honor Tutor Terintegrasi.
          </p>
        </div>
      </footer>
    </div>
  );
}
