/** @format */

import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/hooks/use-user-roles";

export async function getUserRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  const userRoles = user?.userRoles.map((ur) => ur.role.name as RoleName) || [];

  const hasRole = (role: RoleName) => userRoles.includes(role);

  const hasAnyRole = (...roles: RoleName[]) =>
    roles.some((role) => userRoles.includes(role));

  const hasAllRoles = (...roles: RoleName[]) =>
    roles.every((role) => userRoles.includes(role));

  return {
    userRoles,
    isAdmin: hasRole("ADMIN"),
    isJudge: hasRole("JUDGE"),
    isMentor: hasRole("MENTOR"),
    isParticipant: hasRole("PARTICIPANT"),
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}

export async function requireRole(userId: string, role: RoleName | RoleName[]) {
  const { hasRole, hasAnyRole } = await getUserRoles(userId);

  if (Array.isArray(role)) {
    return hasAnyRole(...role);
  }

  return hasRole(role);
}
