/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { DashboardAdmin } from "@/components/dashboard/admin";
import { Separator } from "@/components/ui/separator";

export default async function AdminSlot() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const roles = await getUserRoles(session.user.id);

  if (!roles.isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Overview</h2>
        <p className="text-muted-foreground">
          Manage all aspects of the platform
        </p>
      </div>
      <DashboardAdmin />
      <Separator className="my-8" />
    </div>
  );
}
