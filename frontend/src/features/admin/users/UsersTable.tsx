"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/tables/DataTable";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { getUsersColumns } from "./UsersTableColumns";
import type { AdminUser, UserType } from "@/types/domain.types";
import { UserDetailSlideOver } from "./UserDetailSlideOver";
import { ToggleUserStatusDialog } from "./ToggleUserStatusDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UsersTable() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [selectedCount, setSelectedCount] = useState(0);

  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState<UserType | "">("");
  const [status, setStatus] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "UNVERIFIED"
  >("ALL");

  const debouncedSearch = useDebounce(search, 300);
  const pagination = usePagination({ page: 1, limit: 20 });

  const isActive =
    status === "ACTIVE" ? true : status === "INACTIVE" ? false : undefined;

  const query = useAdminUsers({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch || undefined,
    userType: userType || undefined,
    isActive,
    sort: "createdAt",
    order: "desc",
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    total: 0,
    page: pagination.page,
    limit: pagination.limit,
  };

  const columns = useMemo(
    () =>
      getUsersColumns({
        currentUserId,
        onViewDetails: (u) => {
          setSelected(u);
          setDetailOpen(true);
        },
        onToggleStatus: (u) => {
          setSelected(u);
          setToggleOpen(true);
        },
      }),
    [currentUserId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pagination.reset();
          }}
          placeholder="Search email or name…"
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value as UserType | "");
              pagination.reset();
            }}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">All types</option>
            <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
            <option value="LANDLORD">LANDLORD</option>
            <option value="TENANT">TENANT</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              pagination.reset();
            }}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void query.refetch();
            }}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            onRowSelectionChange={(selected) => setSelectedCount(selected)}
          />
          <DataTablePagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            onPageChange={(p) => pagination.setPage(p)}
            onLimitChange={(nextLimit) => pagination.setLimit(nextLimit)}
            selectedCount={selectedCount}
          />
        </>
      )}

      <UserDetailSlideOver
        user={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
      <ToggleUserStatusDialog
        user={selected}
        open={toggleOpen}
        onClose={() => setToggleOpen(false)}
      />
    </div>
  );
}
