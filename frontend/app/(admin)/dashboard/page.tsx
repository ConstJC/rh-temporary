import { PageHeader } from '@/components/common/PageHeader';
import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Platform health at a glance." />
      <div className="mt-4">
        <AdminDashboard />
      </div>
    </>
  );
}
