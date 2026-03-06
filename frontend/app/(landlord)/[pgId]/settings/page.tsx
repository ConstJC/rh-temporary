'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function LandlordSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Organization settings and member roles" />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Implementation Status</CardTitle>
            <StatusBadge status="PENDING" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Settings flows are planned after core landlord operations are finalized.</p>
          <p>Relevant backend endpoints already available:</p>
          <ul className="list-disc pl-5">
            <li><code>PATCH /property-groups/:id</code></li>
            <li><code>GET/POST/PATCH/DELETE /property-groups/:id/members</code></li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
