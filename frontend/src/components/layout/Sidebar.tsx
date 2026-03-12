'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar.store';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BadgeDollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  Handshake,
  Cable,
  FileClock,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children?: Array<{ href: string; label: string }>;
};

const adminNav: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/property-groups', label: 'Property Groups', icon: Building2 },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/dashboard/subscription-plans', label: 'Subscription Plans', icon: BadgeDollarSign },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/dashboard/settings/roles', label: 'Roles' },
      { href: '/dashboard/settings/menus', label: 'Menus' },
    ],
  },
];

function getLandlordNav(pgId?: string): NavItem[] {
  if (!pgId) return [];

  return [
    { href: `/${pgId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { href: `/${pgId}/properties`, label: 'Properties', icon: Building2 },
    { href: `/${pgId}/leases`, label: 'Tenant Leases', icon: FileClock },
    { href: `/${pgId}/payments`, label: 'Payments', icon: CreditCard },
    { href: `/${pgId}/addons`, label: 'Add-ons', icon: Cable },
    { href: `/${pgId}/utilities`, label: 'Utilities', icon: Handshake },
    { href: `/${pgId}/reports`, label: 'Reports', icon: BarChart3 },
    { href: `/${pgId}/subscription`, label: 'Subscription', icon: BadgeDollarSign },
    { href: `/${pgId}/settings`, label: 'Settings', icon: Settings },
  ];
}

export function Sidebar({ pgId, isAdmin }: { pgId?: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const open = useSidebarStore((s) => s.open);
  const setOpen = useSidebarStore((s) => s.setOpen);
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/dashboard/settings'));
  const isSettingsRoute = pathname.startsWith('/dashboard/settings');
  const isSettingsExpanded = open && (settingsOpen || isSettingsRoute);
  const navItems = isAdmin ? adminNav : getLandlordNav(pgId);

  useEffect(() => {
    function syncBodyScroll() {
      const mobileOpen = open && window.innerWidth < 1024;
      document.body.style.overflow = mobileOpen ? 'hidden' : '';
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && open && window.innerWidth < 1024) {
        setOpen(false);
      }
    }

    syncBodyScroll();
    window.addEventListener('resize', syncBodyScroll);
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', syncBodyScroll);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar backdrop"
        className={cn(
          'fixed inset-0 z-30 bg-black/35 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-primary-900 bg-primary-800 text-primary-50 transition-[width,transform] duration-300 ease-out',
          'w-64',
          open ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
        <div className="flex h-full w-full flex-col pt-6">
          <div className={cn('flex items-center gap-3 px-5 pb-6', open ? 'justify-start' : 'justify-center')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg shadow-primary-900/40">
              <span className="text-base font-semibold">RH</span>
            </div>
            {open && (
              <div>
                <p className="text-sm font-extrabold tracking-tight text-white">RentHub</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-100/80">
                  {isAdmin ? 'System Admin' : 'Landlord Portal'}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2">
            {navItems.map((item) => {
              if (item.children) {
                const parentActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <div key={item.href} className="space-y-1">
                    <button
                      type="button"
                      title={!open ? item.label : undefined}
                      aria-expanded={isSettingsExpanded}
                      aria-controls="settings-submenu"
                      onClick={() => {
                        if (!open) {
                          setOpen(true);
                          setSettingsOpen(true);
                          return;
                        }
                        setSettingsOpen((prev) => !(prev || isSettingsRoute));
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        open ? 'justify-start' : 'justify-center',
                        parentActive
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-950/40'
                          : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {open ? (
                        <>
                          <span className="ml-1 flex-1 truncate text-left">{item.label}</span>
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', isSettingsExpanded && 'rotate-180')}
                            aria-hidden
                          />
                        </>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </button>

                    {isSettingsExpanded && (
                      <div id="settings-submenu" className="space-y-1 pl-9">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => {
                                if (window.innerWidth < 1024) {
                                  setOpen(false);
                                }
                              }}
                              className={cn(
                                'block rounded-md px-2 py-1.5 text-sm transition-colors',
                                childActive
                                  ? 'bg-primary-700 text-white'
                                  : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!open ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    open ? 'justify-start' : 'justify-center',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-950/40'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
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
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
