'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function UtilitiesPage() {
  return (
    <>
      <PageHeader
        title="Utilities"
        description="Meter readings and metered billing are queued for Phase 2"
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
            <li>POST/GET <code>/property-groups/:pgId/utility-readings</code></li>
            <li>POST <code>/property-groups/:pgId/billing/generate</code></li>
          </ul>
          <p>
            Guardrails to enforce in backend: no negative usage, no duplicate period readings,
            and strict org-scoped access.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
