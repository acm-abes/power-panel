/** @format */

"use client";

import { useSession } from "@/lib/auth-client";

export type RoleName = "ADMIN" | "JUDGE" | "MENTOR" | "PARTICIPANT";

export function useUserRoles() {
  const { data: session } = useSession();

  const userRoles =
    session?.user.userRoles?.map((ur) => ur.role.name) || ([] as RoleName[]);

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
