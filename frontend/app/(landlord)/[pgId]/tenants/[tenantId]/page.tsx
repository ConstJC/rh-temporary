'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useTenant } from '@/features/landlord/hooks/useTenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Mail, Phone, User, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; tenantId: string }>;
}) {
  const { pgId, tenantId } = use(params);
  const { data: tenant, isLoading } = useTenant(pgId, tenantId);
  const router = useRouter();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Tenant Details" />
        <div className="mt-6 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (!tenant) {
    return (
      <>
        <PageHeader title="Tenant Not Found" />
        <div className="mt-6 text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">Tenant not found.</p>
          <Button onClick={() => router.push(`/${pgId}/tenants`)} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </>
    );
  }

  const activeLease = tenant.leases?.find((l) => l.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        title={`${tenant.firstName} ${tenant.lastName}`}
        description="Tenant details and lease history"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/${pgId}/tenants`)}>
              Back
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tenant Information</CardTitle>
              <StatusBadge status={tenant.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <div className="mt-1 flex items-center text-slate-900">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  {tenant.firstName} {tenant.lastName}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Phone</label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                  {tenant.phone}
                </div>
              </div>
              {tenant.email && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <div className="mt-1 flex items-center text-slate-900">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {tenant.email}
                  </div>
                </div>
              )}
            </div>
            {tenant.internalNotes && (
              <div>
                <label className="text-sm font-medium text-slate-600">Internal Notes</label>
                <p className="mt-1 text-slate-900 whitespace-pre-wrap">{tenant.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {activeLease && (
          <Card>
            <CardHeader>
              <CardTitle>Current Lease</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">Property</label>
                  <p className="mt-1 text-slate-900">
                    {activeLease.unit.property.propertyName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Unit</label>
                  <p className="mt-1 text-slate-900">{activeLease.unit.unitName}</p>
                </div>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${pgId}/leases/${activeLease.id}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Lease Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tenant.leases && tenant.leases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lease History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.leases.map((lease) => (
                  <div
                    key={lease.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/${pgId}/leases/${lease.id}`)}
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {lease.unit.property.propertyName} - {lease.unit.unitName}
                      </p>
                      <p className="text-sm text-slate-500">
                        Status: {lease.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
