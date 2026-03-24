import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="System-level reports and exports."
      />
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Reports module scaffolding is ready. Add report widgets and export
          actions in this route.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/audit"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Open Audit Trail
        </Link>
      </div>
    </>
  );
}
