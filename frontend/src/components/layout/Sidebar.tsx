'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar.store';

const adminNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/landlords', label: 'Landlords' },
  { href: '/dashboard/subscriptions', label: 'Subscriptions' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function Sidebar({ pgId, isAdmin }: { pgId?: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const open = useSidebarStore((s) => s.open);

  const landlordNav = pgId
    ? [
        { href: `/${pgId}/overview`, label: 'Overview' },
        { href: `/${pgId}/properties`, label: 'Properties' },
        { href: `/${pgId}/tenants`, label: 'Tenants' },
        { href: `/${pgId}/leases`, label: 'Leases' },
        { href: `/${pgId}/payments`, label: 'Payments' },
      ]
    : [];

  const nav = isAdmin ? adminNav : landlordNav;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-56 border-r border-primary-800 bg-primary-700 transition-transform',
        open ? 'w-56' : 'w-0 overflow-hidden'
      )}
    >
      <div className="flex h-full w-56 flex-col pt-16">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
