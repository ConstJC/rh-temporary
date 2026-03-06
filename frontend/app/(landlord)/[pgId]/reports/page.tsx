'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Income, occupancy, and ledger reporting (Phase 3)" />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Implementation Status</CardTitle>
            <StatusBadge status="PENDING" />
          </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          Report pages will be built after the billing expansion API is completed and stabilized.
        </CardContent>
      </Card>
    </>
  );
}
