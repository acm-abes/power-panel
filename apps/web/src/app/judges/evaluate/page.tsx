/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@power/db";
import { Page, PageHeading, PageContent } from "@/components/page";
import { JudgeEvaluationClient } from "@/components/judges/evaluation-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function JudgesEvaluatePage() {
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

  // Get evaluation criteria to display
  const criteria = await prisma.evaluationCriterion.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <Page>
      <PageHeading
        title="Evaluation Dashboard"
        description="Review and score assigned teams"
      />

      <PageContent>
        <JudgeEvaluationClient />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
            <CardDescription>
              Use these criteria to score each team (0-100 scale)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="border-l-2 border-primary pl-4"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold">{criterion.subject}</h3>
                    <span className="text-sm text-muted-foreground">
                      Max: {criterion.fullMark}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {criterion.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
