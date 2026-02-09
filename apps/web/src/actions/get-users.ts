/** @format */

"use server";

import { prisma } from "@power/db";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";

export async function getUsers() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    throw new Error("Only admins can view users");
  }

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

  return users;
}

export async function getRoles() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    throw new Error("Only admins can view roles");
  }

  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return roles;
}
