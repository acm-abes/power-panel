/** @format */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/user-management-table";
import { Page, PageHeading, PageContent } from "@/components/page";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    redirect("/");
  }

  // Get all users with their roles
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get all available roles
  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

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
