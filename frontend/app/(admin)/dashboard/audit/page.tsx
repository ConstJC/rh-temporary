import { PageHeader } from '@/components/common/PageHeader';
import { AuditLogTable } from '@/features/admin/audit/AuditLogTable';

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader title="Audit Trail" description="Immutable platform activity log (read-only)." />
      <div className="mt-4">
        <AuditLogTable />
      </div>
    </>
  );
}

