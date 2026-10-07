'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
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
import { LogOut, Shield, GraduationCap, Building2, UserCog } from 'lucide-react';
import type { UserRole } from '@/types/database.types';

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  role?: UserRole | string;
  subrole?: string | null;
}

export function UserNav({ user: propUser, role: propRole, subrole }: UserNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const name = propUser?.name || 'User';
  const email = propUser?.email || '';
  const role = (propRole || 'tutor') as UserRole;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login?logged_out=true';
  };

  const getInitials = (displayName: string) => {
    return (
      displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'MB'
    );
  };

  const roleColors: Record<string, string> = {
    management: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
    tutor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
    finance: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
  };

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
            onClick={() => router.push('/tutor/profile')}
            className="cursor-pointer font-medium"
          >
            <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Profil & Keamanan</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowLogoutDialog(true)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar (Logout)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
