/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@power/db";
import { Page, PageContent, PageHeading } from "@/components/page";
import { TeamAssignmentManager } from "@/components/admin/team-assignment-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
    redirect("/");
  }
}

export default async function AssignmentsPage() {
  await checkAdmin();

  // Fetch panels with their current assignments
  const panels = await prisma.panel.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { judges: true, submissions: true },
      },
      judges: {
        include: {
          user: {
            select: { id: true, name: true, trackPreferences: true },
          },
        },
      },
      slot: {
        select: { name: true, day: true, startTime: true, endTime: true },
      },
    },
  });

  // Fetch unassigned submissions count (submissions without any assignments)
  const unassignedCount = await prisma.submission.count({
    where: { assignments: { none: {} } },
  });

  return (
    <Page>
      <div className="flex items-center justify-between">
        <PageHeading
          title="Team Assignments"
          description={`Assign teams to panels. ${unassignedCount} unassigned submissions.`}
        />
        <Link href="/admin/panels">
          <Button variant="outline" size="sm">
            <ArrowLeft className=" h-4 w-4" />
            Back to Panels
          </Button>
        </Link>
      </div>

      <PageContent className="space-y-8">
        <TeamAssignmentManager
          panels={panels}
          unassignedCount={unassignedCount}
        />
      </PageContent>
    </Page>
  );
}
