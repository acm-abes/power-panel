/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Page, PageHeading, PageContent } from "@/components/page";
import { EvaluationForm } from "@/components/judges/evaluation-form";
import { getTeamEvaluationFormDataAction } from "@/server/actions/judge-evaluation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TeamEvaluationPageProps {
  params: Promise<{
    teamId: string;
  }>;
  searchParams: Promise<{
    slot?: string;
  }>;
}

export default async function TeamEvaluationPage({
  params,
  searchParams,
}: TeamEvaluationPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user is a judge
  const { isJudge } = await getUserRoles(session.user.id);

  if (!isJudge) {
    redirect("/");
  }

  const { teamId } = await params;
  const { slot } = await searchParams;

  if (!slot) {
    console.log("Slot ID not found");
    redirect("/judges/evaluate");
  }

  const result = await getTeamEvaluationFormDataAction(teamId, slot);

  if (!result.success || result.error) {
    return (
      <Page>
        <PageHeading title="Error" />
        <PageContent>
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{result.error}</p>
            <Link href="/judges/evaluate">
              <Button variant="outline">
                <ArrowLeft className=" h-4 w-4" />
                Back to Evaluation Dashboard
              </Button>
            </Link>
          </div>
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-center justify-between">
        <PageHeading
          title={`Evaluate: ${result.team.name}`}
          description={`Team Code: ${result.team.teamCode}`}
        />
        <Link href="/judges/evaluate">
          <Button variant="outline" size="sm">
            <ArrowLeft className=" h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <PageContent>
        <EvaluationForm
          team={result.team}
          criteria={result.criteria}
          existingEvaluation={result.existingEvaluation}
          slotId={slot}
        />
      </PageContent>
    </Page>
  );
}
