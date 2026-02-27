import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.config';
import { AppShell } from '@/components/layout/AppShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { userType?: string; role?: string } | undefined;
  const isSystemAdmin = user?.role === 'ADMIN' && user?.userType === 'SYSTEM_ADMIN';
  if (!session?.user || !isSystemAdmin) {
    redirect('/select-group');
  }
  return <AppShell isAdmin>{children}</AppShell>;
}
