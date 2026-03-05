import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';

export default function AdminDashboardSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Platform settings and administration controls." />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/settings/roles"
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Roles
        </Link>
        <Link
          href="/dashboard/settings/menus"
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Menus
        </Link>
      </div>
    </>
  );
}
