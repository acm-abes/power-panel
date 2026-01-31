/** @format */

import { auth } from "@/lib/auth";
import { prisma } from "@power/db";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Page, PageHeading, PageContent } from "@/components/page";

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

  // Get judge assignments
  const judgeAssignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: session.user.id },
    include: {
      team: {
        include: {
          evaluations: {
            where: {
              judgeId: session.user.id,
            },
          },
        },
      },
    },
  });

  // Get evaluation criteria
  const criteria = await prisma.evaluationCriterion.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const teamsToEvaluate = judgeAssignments.filter(
    (assignment) => assignment.team.evaluations.length === 0,
  );
  const completedEvaluations = judgeAssignments.filter(
    (assignment) => assignment.team.evaluations.length > 0,
  );

  return (
    <Page>
      <PageHeading
        title="Evaluation Dashboard"
        description="Review and score assigned teams"
      />

      <PageContent>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pending Evaluations</CardTitle>
              <CardDescription>Teams waiting for your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teamsToEvaluate.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>
                Evaluations you&apos;ve submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedEvaluations.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Teams to Evaluate</h2>
            {teamsToEvaluate.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending evaluations. Check back later!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {teamsToEvaluate.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle>{assignment.team.name}</CardTitle>
                      {assignment.team.track && (
                        <CardDescription>
                          Track: {assignment.team.track}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <a
                        href={`/judges/evaluate/${assignment.team.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Start Evaluation →
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {completedEvaluations.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Completed Evaluations
              </h2>
              <div className="grid gap-4">
                {completedEvaluations.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle>{assignment.team.name}</CardTitle>
                      {assignment.team.track && (
                        <CardDescription>
                          Track: {assignment.team.track}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">
                        ✓ Evaluation submitted
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
            <CardDescription>
              Use these criteria to score each team
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
