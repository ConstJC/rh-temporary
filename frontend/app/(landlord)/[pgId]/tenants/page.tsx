'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useTenants } from '@/features/landlord/hooks/useTenants';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Mail, Phone, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function TenantsPage() {
  const { pgId } = usePropertyGroup();
  const { data: tenants, isLoading } = useTenants(pgId);
  const router = useRouter();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Tenants" description="Manage your tenants" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage your tenants"
        action={
          <Button onClick={() => router.push(`/${pgId}/tenants/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        }
      />

      {tenants && tenants.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No tenants yet"
          description="Get started by adding your first tenant."
          action={
            <Button onClick={() => router.push(`/${pgId}/tenants/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          }
          className="mt-6"
        />
      ) : (
        <div className="mt-6 bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Lease</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants?.map((tenant) => {
                const activeLease = tenant.leases?.find((l) => l.status === 'ACTIVE');
                return (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/${pgId}/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">
                      {tenant.firstName} {tenant.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tenant.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {tenant.email}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {tenant.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      {activeLease ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {activeLease.unit.property.propertyName}
                          </div>
                          <div className="text-slate-500">
                            {activeLease.unit.unitName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No active lease</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${pgId}/tenants/${tenant.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
