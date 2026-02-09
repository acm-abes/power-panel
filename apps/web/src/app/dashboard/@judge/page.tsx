/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { DashboardJudge } from "@/components/dashboard/judge";
import { Separator } from "@/components/ui/separator";

export default async function JudgeSlot() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const roles = await getUserRoles(session.user.id);

  if (!roles.isJudge) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Judge Panel</h2>
        <p className="text-muted-foreground">
          Evaluate assigned team submissions
        </p>
      </div>
      <DashboardJudge userId={session.user.id} />
      <Separator className="my-8" />
    </div>
  );
}
