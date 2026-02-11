/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@power/db";
import { Page, PageContent, PageHeading } from "@/components/page";
import { PanelManager } from "@/components/admin/panel-manager";

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

export default async function AdminPanelsPage() {
  await checkAdmin();

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
    },
  });

  return (
    <Page>
      <PageHeading title={"Panels Management"} />

      <PageContent className="space-y-8">
        <PanelManager initialPanels={panels} />
      </PageContent>
    </Page>
  );
}
