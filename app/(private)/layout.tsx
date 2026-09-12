import { requireAuthUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthUser();

  return <>{children}</>;
}
