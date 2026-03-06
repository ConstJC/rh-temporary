'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useLeases } from '@/features/landlord/hooks/useLeases';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatPeso, toDateOrNull } from '@/lib/utils';

export default function LeasesPage() {
  const { pgId } = usePropertyGroup();
  const { data: leases, isLoading } = useLeases(pgId);
  const router = useRouter();
  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : '—';
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Leases" description="Manage tenant leases" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Leases"
        description="Manage tenant leases"
        action={
          <Button onClick={() => router.push(`/${pgId}/leases/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Lease
          </Button>
        }
      />

      {leases && leases.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No leases yet"
          description="Create your first lease agreement."
          action={
            <Button onClick={() => router.push(`/${pgId}/leases/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Lease
            </Button>
          }
          className="mt-6"
        />
      ) : (
        <div className="mt-6 bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property & Unit</TableHead>
                <TableHead>Lease Type</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases?.map((lease) => (
                <TableRow
                  key={lease.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/${pgId}/leases/${lease.id}`)}
                >
                  <TableCell className="font-medium">
                    {lease.tenant.firstName} {lease.tenant.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {lease.unit.property.propertyName}
                      </div>
                      <div className="text-slate-500">
                        {lease.unit.unitName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {lease.leaseType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateSafe(lease.moveInDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPeso(lease.rentAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lease.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${pgId}/leases/${lease.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
