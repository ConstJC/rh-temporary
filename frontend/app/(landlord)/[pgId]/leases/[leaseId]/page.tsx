'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useLease } from '@/features/landlord/hooks/useLeases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Home, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatPeso, toDateOrNull } from '@/lib/utils';

export default function LeaseDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; leaseId: string }>;
}) {
  const { pgId, leaseId } = use(params);
  const { data: lease, isLoading, isFetching, refetch } = useLease(pgId, leaseId);
  const router = useRouter();
  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : '—';
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Lease Details" />
        <div className="mt-6 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (!lease) {
    return (
      <>
        <PageHeader title="Lease Not Found" />
        <div className="mt-6 text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">Lease not found.</p>
          <Button onClick={() => router.push(`/${pgId}/leases`)} className="mt-4">
            Back to Leases
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Lease Details"
        description={`${lease.tenant.firstName} ${lease.tenant.lastName}`}
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push(`/${pgId}/leases`)}>
              Back
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lease Information</CardTitle>
              <StatusBadge status={lease.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Tenant</label>
                <div className="mt-1 flex items-center text-slate-900">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  <button
                    onClick={() => router.push(`/${pgId}/tenants/${lease.tenant.id}`)}
                    className="hover:underline"
                  >
                    {lease.tenant.firstName} {lease.tenant.lastName}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Property & Unit</label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Home className="w-4 h-4 mr-2 text-slate-400" />
                  <button
                    onClick={() => router.push(`/${pgId}/properties/${lease.unit.property.id}`)}
                    className="hover:underline"
                  >
                    {lease.unit.property.propertyName} - {lease.unit.unitName}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Lease Type</label>
                <p className="mt-1 text-slate-900">{lease.leaseType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Move-in Date</label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  {formatDateSafe(lease.moveInDate, 'MMMM dd, yyyy')}
                </div>
              </div>
              {lease.moveOutDate && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Move-out Date</label>
                  <div className="mt-1 flex items-center text-slate-900">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {formatDateSafe(lease.moveOutDate, 'MMMM dd, yyyy')}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-600">Monthly Rent</label>
                <div className="mt-1 flex items-center text-slate-900 font-semibold">
                  <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                  {formatPeso(lease.rentAmount)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Security Deposit</label>
                <p className="mt-1 text-slate-900">{formatPeso(lease.securityDeposit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Billing Day</label>
                <p className="mt-1 text-slate-900">Day {lease.billingDay} of each month</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Grace Period</label>
                <p className="mt-1 text-slate-900">{lease.gracePeriodDays} days</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Advance Payment</label>
                <p className="mt-1 text-slate-900">{lease.advanceMonths} month(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {lease.payments && lease.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lease.payments.map((payment) => (
                    <TableRow key={payment.id}>
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
                          onClick={() => router.push(`/${pgId}/payments/${payment.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
