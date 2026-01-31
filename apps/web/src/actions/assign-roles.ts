/** @format */

"use server";

import { RoleName } from "@power/db";
import { auth } from "@/lib/auth";
import { prisma } from "@power/db";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function assignRole(userId: string, roleName: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    throw new Error("Only admins can assign roles");
  }

  // Get the role
  const role = await prisma.role.findUnique({
    where: { name: roleName as RoleName },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Check if user already has this role
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });

  if (existingUserRole) {
    throw new Error("User already has this role");
  }

  // Assign the role
  await prisma.userRole.create({
    data: {
      userId,
      roleId: role.id,
    },
  });

  revalidatePath("/admin/users");
}

export async function removeRole(userId: string, roleName: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    throw new Error("Only admins can remove roles");
  }

  // Get the role
  const role = await prisma.role.findUnique({
    where: { name: roleName as RoleName },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Remove the role
  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });

  revalidatePath("/admin/users");
}
