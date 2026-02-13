/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Page, PageContent, PageHeading } from "@/components/page";
import { JudgeAvailabilityMatrix } from "@/components/admin/judge-availability-matrix";
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

export default async function JudgeAvailabilityPage() {
  await checkAdmin();

  return (
    <Page>
      <div className="flex items-center justify-between">
        <PageHeading
          title="Judge Availability"
          description="Manage judge availability across evaluation time slots"
        />
        <div className="flex gap-2">
          <Link href="/admin/panels/slots">
            <Button variant="outline" size="sm">
              Manage Slots
            </Button>
          </Link>
          <Link href="/admin/panels">
            <Button variant="outline" size="sm">
              <ArrowLeft className=" h-4 w-4" />
              Back to Panels
            </Button>
          </Link>
        </div>
      </div>

      <PageContent className="space-y-8">
        <JudgeAvailabilityMatrix />
      </PageContent>
    </Page>
  );
}
