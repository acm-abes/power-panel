/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { DashboardMentor } from "@/components/dashboard/mentor";
import { Separator } from "@/components/ui/separator";

export default async function MentorSlot() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const roles = await getUserRoles(session.user.id);

  if (!roles.isMentor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mentor Panel</h2>
        <p className="text-muted-foreground">
          Guide and support teams throughout the competition
        </p>
      </div>
      <DashboardMentor userId={session.user.id} />
      <Separator className="my-8" />
    </div>
  );
}
