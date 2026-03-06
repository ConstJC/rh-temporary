'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';

export default function SubscriptionPage() {
  const { group } = usePropertyGroup();

  return (
    <>
      <PageHeader title="Subscription" description="Plan usage and limits" />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-lg">Current Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p><strong>Name:</strong> {group?.name ?? 'N/A'}</p>
          <p>
            Full subscription usage API exists at
            <code> GET /property-groups/:id/subscription</code> and can be wired to this page next.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
