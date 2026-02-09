/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { DashboardParticipant } from "@/components/dashboard/participant";
import { Separator } from "@/components/ui/separator";

export default async function ParticipantSlot() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const roles = await getUserRoles(session.user.id);

  if (!roles.isParticipant) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Your Participation
        </h2>
        <p className="text-muted-foreground">
          Track your team&apos;s progress and submissions
        </p>
      </div>
      <DashboardParticipant userId={session.user.id} />
      <Separator className="my-8" />
    </div>
  );
}
