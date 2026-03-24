"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSubscription } from "@/features/landlord/hooks/useOverviewStats";
import { ForbiddenPage } from "@/components/common/ForbiddenPage";

interface PlanGateProps {
  pgId?: string;
  isAdmin: boolean;
  children: React.ReactNode;
}

function resolveRequiredMenuCode(
  pathname: string,
  pgId: string,
): string | null {
  const base = `/${pgId}`;
  if (!pathname.startsWith(base)) return null;

  const routeChecks: Array<{ prefix: string; menuCode: string }> = [
    { prefix: `${base}/overview`, menuCode: "LANDLORD_DASHBOARD" },
    { prefix: `${base}/properties`, menuCode: "LANDLORD_PROPERTIES" },
    { prefix: `${base}/units`, menuCode: "LANDLORD_PROPERTIES" },
    { prefix: `${base}/tenants`, menuCode: "LANDLORD_TENANTS" },
    { prefix: `${base}/leases`, menuCode: "LANDLORD_LEASES" },
    { prefix: `${base}/payments`, menuCode: "LANDLORD_PAYMENTS" },
    { prefix: `${base}/addons`, menuCode: "LANDLORD_ADDONS" },
    { prefix: `${base}/utilities`, menuCode: "LANDLORD_UTILITIES" },
    { prefix: `${base}/reports`, menuCode: "LANDLORD_REPORTS" },
    { prefix: `${base}/subscription`, menuCode: "LANDLORD_SUBSCRIPTION" },
    { prefix: `${base}/settings`, menuCode: "LANDLORD_SETTINGS" },
  ];

  for (const routeCheck of routeChecks) {
    if (
      pathname === routeCheck.prefix ||
      pathname.startsWith(`${routeCheck.prefix}/`)
    ) {
      return routeCheck.menuCode;
    }
  }

  return null;
}

export function PlanGate({ pgId, isAdmin, children }: PlanGateProps) {
  const pathname = usePathname();
  const requiredMenuCode = useMemo(
    () => (pgId ? resolveRequiredMenuCode(pathname, pgId) : null),
    [pathname, pgId],
  );

  const subscriptionQuery = useSubscription(pgId ?? "");

  if (isAdmin || !pgId || !requiredMenuCode) {
    return <>{children}</>;
  }

  if (subscriptionQuery.isSuccess) {
    const allowedMenus = subscriptionQuery.data.plan.access.menus ?? [];
    if (!allowedMenus.includes(requiredMenuCode)) {
      return (
        <ForbiddenPage
          title="Feature not included in your plan"
          message="Upgrade your subscription plan to access this module."
          ctaHref={`/${pgId}/overview`}
          ctaLabel="Back to Overview"
          fullScreen={false}
        />
      );
    }
  }

  if (subscriptionQuery.isError) {
    return (
      <ForbiddenPage
        title="Unable to verify plan access"
        message="Please refresh the page or check your subscription details."
        ctaHref={`/${pgId}/overview`}
        ctaLabel="Back to Overview"
        fullScreen={false}
      />
    );
  }

  return <>{children}</>;
}
