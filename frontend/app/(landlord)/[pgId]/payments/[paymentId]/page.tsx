"use client";

import { use } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { usePayment } from "@/features/landlord/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Home, Calendar, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatPeso, toDateOrNull, toFiniteNumber } from "@/lib/utils";

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; paymentId: string }>;
}) {
  const { pgId, paymentId } = use(params);
  const { data: payment, isLoading } = usePayment(pgId, paymentId);
  const router = useRouter();
  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : "—";
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Payment Details" />
        <div className="mt-6">
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (!payment) {
    return (
      <>
        <PageHeader title="Payment Not Found" />
        <div className="mt-6 text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">Payment not found.</p>
          <Button
            onClick={() => router.push(`/${pgId}/payments`)}
            className="mt-4"
          >
            Back to Payments
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Payment Details"
        description={`${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${pgId}/payments`)}
            >
              Back
            </Button>
            {payment.status !== "PAID" && (
              <Button
                onClick={() =>
                  router.push(`/${pgId}/payments/${paymentId}/record`)
                }
              >
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Information</CardTitle>
              <StatusBadge status={payment.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Tenant
                </label>
                <div className="mt-1 flex items-center text-slate-900">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  <button
                    onClick={() =>
                      router.push(`/${pgId}/tenants/${payment.lease.tenant.id}`)
                    }
                    className="hover:underline"
                  >
                    {payment.lease.tenant.firstName}{" "}
                    {payment.lease.tenant.lastName}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Property & Unit
                </label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Home className="w-4 h-4 mr-2 text-slate-400" />
                  <button
                    onClick={() =>
                      router.push(
                        `/${pgId}/properties/${payment.lease.unit.property.id}`,
                      )
                    }
                    className="hover:underline"
                  >
                    {payment.lease.unit.property.propertyName} -{" "}
                    {payment.lease.unit.unitName}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Period
                </label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  {formatDateSafe(payment.periodStart, "MMM dd")} -{" "}
                  {formatDateSafe(payment.periodEnd, "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Due Date
                </label>
                <div className="mt-1 flex items-center text-slate-900">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  {formatDateSafe(payment.dueDate, "MMMM dd, yyyy")}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Amount Due
                </label>
                <div className="mt-1 flex items-center text-slate-900 font-semibold text-lg">
                  {formatPeso(payment.amountDue)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Amount Paid
                </label>
                <div className="mt-1 flex items-center text-slate-900 font-semibold text-lg">
                  {formatPeso(payment.amountPaid)}
                </div>
              </div>
              {payment.datePaid && (
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Date Paid
                  </label>
                  <div className="mt-1 flex items-center text-slate-900">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {formatDateSafe(payment.datePaid, "MMMM dd, yyyy")}
                  </div>
                </div>
              )}
              {payment.paymentMethod && (
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Payment Method
                  </label>
                  <div className="mt-1 flex items-center text-slate-900">
                    <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                    {payment.paymentMethod.replace(/_/g, " ")}
                  </div>
                </div>
              )}
            </div>
            {toFiniteNumber(payment.amountDue) >
              toFiniteNumber(payment.amountPaid) && (
              <div className="pt-4 border-t border-slate-200">
                <label className="text-sm font-medium text-slate-600">
                  Balance
                </label>
                <p className="mt-1 text-red-600 font-semibold text-lg">
                  {formatPeso(
                    toFiniteNumber(payment.amountDue) -
                      toFiniteNumber(payment.amountPaid),
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
