"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptionalPropertyGroup } from "@/hooks/usePropertyGroup";

type Crumb = {
  label: string;
  href?: string;
};

const ADMIN_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "property-groups": "Property Groups",
  landlords: "Landlords",
  users: "Users",
  subscriptions: "Subscriptions",
  "subscription-plans": "Subscription Plans",
  addons: "Add-on Catalog",
  audit: "Audit Trail",
  reports: "Reports",
  profile: "My Profile",
  settings: "Settings",
  roles: "Roles",
  menus: "Menus",
};

const LANDLORD_LABELS: Record<string, string> = {
  overview: "Overview",
  properties: "Properties",
  units: "Units",
  tenants: "Tenants",
  leases: "Tenant Leases",
  payments: "Payments",
  addons: "Add-ons",
  utilities: "Utilities",
  reports: "Reports",
  subscription: "Subscription",
  settings: "Settings",
  new: "New",
  record: "Record Payment",
};

function titleizeSegment(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPgCode(pgNumber?: number | null) {
  if (typeof pgNumber !== "number" || Number.isNaN(pgNumber)) return null;
  return `PG-${String(pgNumber).padStart(3, "0")}`;
}

function buildAdminCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", href: "/dashboard" }];

  if (parts.length === 1 && parts[0] === "dashboard") {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  let current = "";
  for (let i = 0; i < parts.length; i += 1) {
    current += `/${parts[i]}`;
    const key = parts[i];
    const label = ADMIN_LABELS[key] ?? titleizeSegment(key);
    const isLast = i === parts.length - 1;
    crumbs.push({ label, href: isLast ? undefined : current });
  }

  return crumbs;
}

function landlordLeafLabel(parts: string[], index: number) {
  const segment = parts[index];
  const prev = parts[index - 1];

  if (segment === "new") {
    if (prev === "properties") return "Add Property";
    if (prev === "tenants") return "Add Tenant";
    if (prev === "leases") return "Create Lease";
    if (prev === "units") return "Add Unit";
    return "New";
  }

  if (prev === "properties" && parts[index + 1] === "units")
    return "Property Details";
  if (prev === "properties") return "Property Details";
  if (prev === "tenants") return "Tenant Details";
  if (prev === "leases") return "Lease Details";
  if (prev === "payments") return "Payment Details";
  if (prev === "units") return "Unit Details";

  if (LANDLORD_LABELS[segment]) return LANDLORD_LABELS[segment];
  return titleizeSegment(segment);
}

function buildLandlordCrumbs(pathname: string, isAdmin: boolean): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const pgId = parts[0];
  const rootHref = isAdmin ? "/dashboard" : `/${pgId}/overview`;
  const crumbs: Crumb[] = [{ label: "Home", href: rootHref }];

  for (let i = 1; i < parts.length; i += 1) {
    const segment = parts[i];
    const prevSegment = parts[i - 1];
    const isEntityId =
      ["properties", "tenants", "leases", "payments", "units"].includes(
        prevSegment,
      ) &&
      segment !== "new" &&
      segment !== "record";
    const label = isEntityId
      ? landlordLeafLabel(parts, i)
      : (LANDLORD_LABELS[segment] ?? titleizeSegment(segment));
    const isLast = i === parts.length - 1;
    const href = isLast ? undefined : `/${parts.slice(0, i + 1).join("/")}`;
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function AppBreadcrumb({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const propertyGroup = useOptionalPropertyGroup();
  const groupName =
    propertyGroup?.group?.name ?? propertyGroup?.group?.groupName;
  const groupCode = formatPgCode(propertyGroup?.group?.pgNumber ?? null);

  const crumbs = useMemo(() => {
    if (
      pathname.startsWith("/dashboard") ||
      pathname === "/landlords" ||
      pathname === "/subscriptions" ||
      pathname === "/settings"
    ) {
      return buildAdminCrumbs(pathname);
    }

    if (pathname.startsWith("/")) {
      return buildLandlordCrumbs(pathname, isAdmin);
    }

    return [{ label: "Home" }];
  }, [pathname, isAdmin]);

  if (!crumbs.length) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div
            key={`${crumb.label}-${idx}`}
            className="flex items-center gap-2"
          >
            {idx === 0 && <Home className="h-3.5 w-3.5 text-slate-400" />}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="hover:text-slate-700">
                {crumb.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-slate-700")}>
                {crumb.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </div>
        );
      })}
      {groupName && !isAdmin && (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {groupName}
          {groupCode ? ` (${groupCode})` : ""}
        </span>
      )}
    </div>
  );
}
