import { PageHeader } from "@/components/common/PageHeader";
import { UsersTable } from "@/features/admin/users/UsersTable";
import { AddUserButton } from "@/features/admin/users/CreateUserSheet";

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="All platform users and account status."
        action={<AddUserButton />}
      />
      <div className="mt-4">
        <UsersTable />
      </div>
    </>
  );
}
