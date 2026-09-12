'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import { authClient } from '@/lib/auth/client'; // Better Auth client - sementara di-comment
import { logoutSyntheticUser } from '@/features/auth/actions/auth.actions';
import { SYNTHETIC_USERS, SyntheticUser } from '@/data/users';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut, Shield, Users, GraduationCap, Building2, UserCog } from 'lucide-react';
import type { UserRole } from '@/types/database.types';

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  role?: UserRole | string;
}

export function UserNav({ user: propUser, role: propRole }: UserNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  // const { data: session } = authClient.useSession(); // Better Auth hook - sementara di-comment
  const [syntheticUser, setSyntheticUser] = useState<SyntheticUser | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)synthetic_user_id=([^;]+)/);
      if (match && match[1]) {
        const found = SYNTHETIC_USERS.find(
          (u) => u.id === match[1] || u.email.toLowerCase() === match[1].toLowerCase()
        );
        if (found) setSyntheticUser(found);
      }
    }
  }, []);

  const name = propUser?.name || syntheticUser?.name || 'User';
  const email = propUser?.email || syntheticUser?.email || '';
  const role = (propRole || syntheticUser?.role || 'tutor') as UserRole;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logoutSyntheticUser();
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Bersihkan cookie di client browser
    if (typeof document !== 'undefined') {
      const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `synthetic_user_id=; path=/; expires=${pastDate}; max-age=0;`;
      document.cookie = `better-auth.session_token=; path=/; expires=${pastDate}; max-age=0;`;
      document.cookie = `__Secure-better-auth.session_token=; path=/; expires=${pastDate}; max-age=0;`;
    }

    // Hard redirect via API endpoint yang memberikan Set-Cookie max-age=0
    window.location.href = '/api/v1/auth/logout';
  };

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'MB';
  };

  const roleColors: Record<string, string> = {
    management: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
    tutor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
    finance: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
  };

  const subrole = syntheticUser?.subrole;

  return (
    <div className="flex items-center gap-3">
      {role && (
        <Badge variant="outline" className={`capitalize hidden sm:inline-flex ${roleColors[role] || ''}`}>
          <Shield className="h-3 w-3 mr-1" />
          {role} {subrole ? `(${subrole.toUpperCase()})` : ''}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-9 w-9 rounded-full focus:outline-none cursor-pointer">
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              {email && <p className="text-xs leading-none text-muted-foreground">{email}</p>}
              <p className="text-[10px] text-muted-foreground pt-1 capitalize">
                Role: {role} {subrole ? `• Subrole: ${subrole}` : ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(role === 'management' || role === 'admin') && (
            <>
              {pathname.startsWith('/management') ? (
                <DropdownMenuItem
                  onClick={() => router.push('/tutor/dashboard')}
                  className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>Beralih ke Mode Tutor</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => router.push('/management/dashboard')}
                  className="cursor-pointer font-medium text-purple-600 dark:text-purple-400 focus:text-purple-600"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Kembali ke Manajemen</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => router.push(role === 'tutor' ? '/tutor/profile' : '/tutor/profile')}
            className="cursor-pointer font-medium"
          >
            <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Profil & Keamanan</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/login?switch=true')} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Ganti Akun Demo</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setShowLogoutDialog(true);
            }}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar (Logout)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Konfirmasi Logout Alert Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Konfirmasi Keluar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari sesi sistem ini? Anda harus melakukan login kembali untuk mengakses data bimbingan belajar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoggingOut}
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
