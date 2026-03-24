import { PageHeader } from "@/components/common/PageHeader";
import { SubscriptionsTable } from "@/features/admin/subscriptions/SubscriptionsTable";

export default function AdminSubscriptionsPage() {
  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Platform subscription overview and expiry management."
      />
      <div className="mt-4">
        <SubscriptionsTable />
      </div>
    </>
  );
}
