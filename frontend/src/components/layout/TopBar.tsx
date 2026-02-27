'use client';

import { useSidebarStore } from '@/stores/sidebar.store';
import { signOut } from 'next-auth/react';
import { Menu, LogOut } from 'lucide-react';

export function TopBar({ title, pgId, isAdmin }: { title?: string; pgId?: string; isAdmin: boolean }) {
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        onClick={toggle}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
      {title && <h1 className="text-lg font-semibold text-slate-900">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
