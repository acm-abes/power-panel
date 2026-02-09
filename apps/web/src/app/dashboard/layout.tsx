/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Page, PageHeading, PageContent } from "@/components/page";
import { ReactNode } from "react";

interface DashboardPageProps {
  admin: ReactNode;
  judge: ReactNode;
  mentor: ReactNode;
  participant: ReactNode;
  announcements: ReactNode;
}

export default async function DashboardLayout({
  admin,
  judge,
  mentor,
  participant,
  announcements,
}: DashboardPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const roles = await getUserRoles(session.user.id);

  return (
    <Page>
      <PageHeading
        title="Dashboard"
        description={`Welcome back, ${session.user.name}`}
        badge={
          <div className="flex gap-2">
            {roles.isAdmin && <Badge>Admin</Badge>}
            {roles.isJudge && <Badge variant="secondary">Judge</Badge>}
            {roles.isMentor && <Badge variant="secondary">Mentor</Badge>}
            {roles.isParticipant && (
              <Badge variant="secondary">Participant</Badge>
            )}
          </div>
        }
      />

      <PageContent>
        <div className="space-y-8">
          {admin}
          {judge}
          {mentor}
          {participant}
          {announcements}
        </div>
      </PageContent>
    </Page>
  );
}
