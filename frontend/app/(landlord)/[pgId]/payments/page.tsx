'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { usePayments } from '@/features/landlord/hooks/usePayments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatPeso, toDateOrNull } from '@/lib/utils';

export default function PaymentsPage() {
  const { pgId } = usePropertyGroup();
  const { data: payments, isLoading } = usePayments(pgId);
  const router = useRouter();
  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : '—';
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Payments" description="Track rental payments" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Payments" description="Track rental payments" />

      {payments && payments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-12 h-12" />}
          title="No payments yet"
          description="Payments will appear here once leases are created."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 bg-white rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property & Unit</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/${pgId}/payments/${payment.id}`)}
                >
                  <TableCell className="font-medium">
                    {payment.lease.tenant.firstName} {payment.lease.tenant.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {payment.lease.unit.property.propertyName}
                      </div>
                      <div className="text-slate-500">
                        {payment.lease.unit.unitName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateSafe(payment.periodStart, 'MMM dd')} -{' '}
                    {formatDateSafe(payment.periodEnd, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {formatDateSafe(payment.dueDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPeso(payment.amountDue)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPeso(payment.amountPaid)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${pgId}/payments/${payment.id}`);
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
