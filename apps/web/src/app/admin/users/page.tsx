/** @format */

import { getUsers, getRoles } from "@/actions/get-users";
import { UserManagementTable } from "@/components/user-management-table";
import { Page, PageHeading, PageContent } from "@/components/page";

export default async function AdminUsersPage() {
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);

  return (
    <Page>
      <PageHeading
        title="User Management"
        description="Assign and manage user roles"
      />
      <PageContent>
        <UserManagementTable
          users={users}
          availableRoles={roles.map((r) => r.name)}
        />
      </PageContent>
    </Page>
  );
}
