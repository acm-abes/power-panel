/** @format */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/user-management-table";

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Assign and manage user roles
        </p>
      </div>

      <UserManagementTable
        users={users}
        availableRoles={roles.map((r) => r.name)}
      />
    </div>
  );
}
