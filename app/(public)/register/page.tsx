import { redirect } from 'next/navigation';

/**
 * Halaman pendaftaran sementara dinonaktifkan.
 * Akan diaktifkan kembali ketika sistem pendaftaran bimbel siap diimplementasikan.
 * Akun baru hanya dapat dibuat oleh Management melalui panel admin.
 */
export default function RegisterPage() {
  redirect('/login');
}
