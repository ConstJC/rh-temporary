'use client';

import { FormEvent, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePayment, useRecordPayment } from '@/features/landlord/hooks/usePayments';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types/domain.types';
import { formatPeso, toFiniteNumber } from '@/lib/utils';

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH', label: 'GCash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to record payment. Please try again.';
}

export default function RecordPaymentPage({
  params,
}: {
  params: Promise<{ pgId: string; paymentId: string }>;
}) {
  const { pgId, paymentId } = use(params);
  const router = useRouter();

  const { data: payment, isLoading } = usePayment(pgId, paymentId);
  const recordPayment = useRecordPayment(pgId, paymentId);

  const [amountPaid, setAmountPaid] = useState('');
  const [datePaid, setDatePaid] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountPaidValue = Number(amountPaid);
    if (!Number.isFinite(amountPaidValue) || amountPaidValue <= 0) {
      toast.error('Amount paid must be greater than 0.');
      return;
    }

    try {
      await recordPayment.mutateAsync({
        amountPaid: amountPaidValue,
        datePaid,
        paymentMethod,
        paymentDetails: notes ? { notes } : undefined,
      });
      toast.success('Payment recorded');
      router.push(`/${pgId}/payments/${paymentId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Record Payment" description="Apply payment to balance" />
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-slate-100" />
      </>
    );
  }

  if (!payment) {
    return (
      <>
        <PageHeader title="Payment Not Found" />
        <Card className="mt-6 max-w-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">The payment record could not be loaded.</p>
            <Button className="mt-4" onClick={() => router.push(`/${pgId}/payments`)}>
              Back to Payments
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const remainingBalance = toFiniteNumber(payment.amountDue) - toFiniteNumber(payment.amountPaid);

  return (
    <>
      <PageHeader
        title="Record Payment"
        description={`${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
        action={
          <Button variant="outline" onClick={() => router.push(`/${pgId}/payments/${paymentId}`)}>
            Cancel
          </Button>
        }
      />

      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Entry</CardTitle>
            <StatusBadge status={payment.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-slate-500">Amount Due</p>
              <p className="font-semibold text-slate-900">{formatPeso(payment.amountDue)}</p>
            </div>
            <div>
              <p className="text-slate-500">Amount Paid</p>
              <p className="font-semibold text-slate-900">{formatPeso(payment.amountPaid)}</p>
            </div>
            <div>
              <p className="text-slate-500">Remaining Balance</p>
              <p className="font-semibold text-danger-600">{formatPeso(remainingBalance)}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="amountPaid" className="text-sm font-medium text-slate-700">
                  Amount Paid
                </label>
                <Input
                  id="amountPaid"
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={remainingBalance > 0 ? remainingBalance : undefined}
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  placeholder={remainingBalance > 0 ? String(remainingBalance) : '0'}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="datePaid" className="text-sm font-medium text-slate-700">
                  Date Paid
                </label>
                <Input
                  id="datePaid"
                  type="date"
                  value={datePaid}
                  onChange={(event) => setDatePaid(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium text-slate-700">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Receipt #, bank reference, or internal notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${pgId}/payments/${paymentId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending || payment.status === 'PAID'}>
                {recordPayment.isPending ? 'Saving...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
