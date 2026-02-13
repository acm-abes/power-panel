/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Page, PageContent, PageHeading } from "@/components/page";
import { SlotManager } from "@/components/admin/slot-manager";
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

export default async function SlotsPage() {
  await checkAdmin();

  return (
    <Page>
      <div className="flex items-center justify-between">
        <PageHeading
          title="Evaluation Slots"
          description="Create and manage time slots for panel evaluations"
        />
        <Link href="/admin/panels">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Panels
          </Button>
        </Link>
      </div>

      <PageContent className="space-y-8">
        <SlotManager />
      </PageContent>
    </Page>
  );
}
