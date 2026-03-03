import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.config';
import type { UserType, PropertyGroupSummary } from '@/types/domain.types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const baseUrl = apiUrl.replace(/\/$/, '');

async function getDefaultPropertyGroupId(accessToken: string | undefined): Promise<string | null> {
  if (!accessToken || !baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/property-groups`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const groups = (json.data ?? json) as PropertyGroupSummary[];
    if (!Array.isArray(groups) || groups.length === 0) return null;
    return groups[0].id;
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { userType?: UserType; role?: string } | undefined;

  // Unauthenticated: simple placeholder landing until full design (Phase B)
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="mx-4 max-w-md rounded-lg bg-white p-8 shadow">
          <h1 className="text-2xl font-semibold text-slate-900">RentHub</h1>
          <p className="mt-2 text-slate-600">
            Sign in to manage your properties, tenants, and payments.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="/login"
              className="flex-1 rounded-md bg-primary-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-600"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    );
  }

  const userType = user?.userType;
  const role = user?.role;
  const accessToken = (session as { accessToken?: string }).accessToken;

  if (role === 'ADMIN' && userType === 'SYSTEM_ADMIN') {
    redirect('/dashboard');
  }

  if (userType === 'TENANT') {
    redirect('/tenant-use-mobile');
  }

  if (role === 'USER' && userType === 'LANDLORD') {
    const pgId = await getDefaultPropertyGroupId(accessToken);
    if (pgId) {
      redirect(`/${pgId}/overview`);
    }

    // No property group found – show simple message for now
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="mx-4 max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-lg font-semibold text-slate-900">No organization found</h1>
          <p className="mt-2 text-sm text-slate-600">
            We couldn&apos;t find a Property Group for your account. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Fallback: unknown combination → send to login
  redirect('/login');
}
