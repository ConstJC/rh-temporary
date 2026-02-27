import { PageHeader } from '@/components/common/PageHeader';

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="KPIs, occupancy, and recent activity" />
      <p className="mt-4 text-sm text-slate-500">
        Overview dashboard with KPI cards and charts will be added in Phase 4.
      </p>
    </>
  );
}
