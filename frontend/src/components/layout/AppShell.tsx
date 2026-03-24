"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useSidebarStore } from "@/stores/sidebar.store";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/common/AppBreadcrumb";
import { PlanGate } from "@/components/common/PlanGate";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  pgId?: string;
  isAdmin: boolean;
}

export function AppShell({ children, title, pgId, isAdmin }: AppShellProps) {
  const open = useSidebarStore((s) => s.open);
  const mainMargin = open ? "lg:ml-64" : "lg:ml-20";
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <Sidebar pgId={pgId} isAdmin={isAdmin} />
      <TopBar title={title} isAdmin={isAdmin} pgId={pgId} />
      <main
        className={cn(
          "pt-14 transition-[margin] duration-300 ease-out",
          mainMargin,
        )}
      >
        <div className="p-3 sm:p-4 md:p-6">
          <AppBreadcrumb isAdmin={isAdmin} />
          <PlanGate pgId={pgId} isAdmin={isAdmin}>
            {children}
          </PlanGate>
        </div>
      </main>
    </div>
  );
}
