'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar.store';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ClipboardList,
} from 'lucide-react';

const adminNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/landlords', label: 'Landlords', icon: Building2 },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/audit', label: 'Audit Trail', icon: ClipboardList },
] as const;

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

  const widthClass = isAdmin
    ? open
      ? 'w-64'
      : 'w-20'
    : open
    ? 'w-56'
    : 'w-0 overflow-hidden';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-primary-900 bg-primary-800 text-primary-50 transition-[width]',
        widthClass
      )}
    >
      <div className="flex h-full w-full flex-col pt-6">
        <div className={cn("flex items-center gap-3 px-5 pb-6", open ? "justify-start" : "justify-center")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg shadow-primary-900/40">
            <span className="text-base font-semibold">RH</span>
          </div>
          {open && (
            <div>
              <p className="text-sm font-extrabold tracking-tight text-white">RentHub</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-100/80">
                System Admin
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {isAdmin
            ? adminNav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      open ? 'justify-start' : 'justify-center',
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-950/40'
                        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span
                      className={cn(
                        'truncate transition-opacity duration-150',
                        open ? 'ml-1 opacity-100' : 'sr-only opacity-0'
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })
            : landlordNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
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
