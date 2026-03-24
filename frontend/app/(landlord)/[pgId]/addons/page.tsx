"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function AddonsPage() {
  return (
    <>
      <PageHeader
        title="Add-ons"
        description="Catalog and unit-level charge assignment will be delivered in Phase 2"
      />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Implementation Status</CardTitle>
            <StatusBadge status="PENDING" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Planned backend endpoints:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              GET/POST/PATCH <code>/property-groups/:pgId/addon-catalog</code>
            </li>
            <li>
              GET/POST/PATCH{" "}
              <code>/property-groups/:pgId/units/:unitId/addons</code>
            </li>
          </ul>
          <p>
            Frontend implementation in this release focuses on core operations
            first (properties, tenants, leases, payments).
          </p>
        </CardContent>
      </Card>
    </>
  );
}
