'use client';

import { useSidebarStore } from '@/stores/sidebar.store';
import { signOut, useSession } from 'next-auth/react';
import { Menu, LogOut, Bell, Search, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function ProfileDropdown({ isAdmin, pgId }: { isAdmin: boolean; pgId?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const landlordSettingsUrl = pgId ? `/${pgId}/settings` : '/';
  const profileUrl = isAdmin ? '/dashboard/profile' : landlordSettingsUrl;
  const accountSettingsUrl = isAdmin ? '/dashboard/settings' : landlordSettingsUrl;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {initials}
        </div>
        <span className="hidden text-sm font-medium sm:inline">{firstName}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(profileUrl);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(accountSettingsUrl);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              Account Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/login' });
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar({ title, isAdmin, pgId }: { title?: string; isAdmin: boolean; pgId?: string }) {
  const open = useSidebarStore((s) => s.open);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-4 sm:px-4 lg:px-6',
        'left-0 right-0 lg:right-0 transition-[left] duration-300 ease-out',
        open ? 'lg:left-64' : 'lg:left-20'
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {title && <h1 className="text-lg font-semibold text-slate-900">{title}</h1>}

      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={
              isAdmin
                ? 'Search systems, properties, or users...'
                : 'Search properties, tenants, or reports...'
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-primary-700"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
        <ProfileDropdown isAdmin={isAdmin} pgId={pgId} />
      </div>
    </header>
  );
}
