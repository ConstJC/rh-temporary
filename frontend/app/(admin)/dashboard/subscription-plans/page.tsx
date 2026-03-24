import { PageHeader } from "@/components/common/PageHeader";
import { SubscriptionPlansTable } from "@/features/admin/subscription-plans/SubscriptionPlansTable";

export default function SubscriptionPlansPage() {
  return (
    <>
      <PageHeader
        title="Subscription Plans"
        description="Create and manage billing plans available to property groups."
      />
      <div className="mt-4">
        <SubscriptionPlansTable />
      </div>
    </>
  );
}
