/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { headers } from "next/headers";
import { Page, PageContent, PageHeading } from "@/components/page";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionDetails } from "@/components/submission-details";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Optimized: Only fetch what we need for team info
async function getTeamMembership(userId: string) {
  return await prisma.teamMember.findFirst({
    where: { userId },
    select: {
      id: true,
      role: true,
      team: {
        select: {
          id: true,
          name: true,
          teamCode: true,
          members: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          submission: {
            select: {
              id: true,
              psId: true,
              documentPath: true,
              documentSize: true,
              additionalNotes: true,
              isLocked: true,
              submittedAt: true,
              updatedAt: true,
              problemStatement: {
                select: {
                  psId: true,
                  title: true,
                  track: true,
                  provider: true,
                },
              },
            },
          },
          // Count evaluations instead of loading all
          _count: {
            select: {
              evaluations: {
                where: {
                  submittedAt: { not: null },
                },
              },
            },
          },
        },
      },
    },
  });
}

// Optimized: Separate query for evaluations with aggregated scores
async function getTeamEvaluations(teamId: string) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      teamId,
      submittedAt: { not: null },
    },
    select: {
      id: true,
      extraPoints: true,
      extraJustification: true,
      submittedAt: true,
      judge: {
        select: {
          id: true,
          name: true,
        },
      },
      scores: {
        select: {
          id: true,
          score: true,
          criterion: {
            select: {
              id: true,
              subject: true,
              description: true,
              fullMark: true,
              order: true,
            },
          },
        },
        orderBy: {
          criterion: {
            order: "asc",
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return evaluations;
}

// Optimized: Separate query for mentor feedbacks with pagination
async function getTeamMentorFeedbacks(teamId: string, limit: number = 10) {
  return await prisma.mentorFeedback.findMany({
    where: { teamId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      mentor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

// Optimized: Only fetch problem statements when needed
async function getProblemStatementsForSubmission(hasSubmission: boolean) {
  if (hasSubmission) {
    return null; // Don't fetch if already submitted
  }

  // Cache this with Next.js cache
  return await prisma.problemStatement.findMany({
    select: {
      id: true,
      psId: true,
      track: true,
      title: true,
      provider: true,
      content: true,
    },
    orderBy: [{ track: "asc" }, { psId: "asc" }],
  });
}

// Calculate statistics from evaluations
function calculateTeamStatistics(
  evaluations: Awaited<ReturnType<typeof getTeamEvaluations>>,
) {
  if (evaluations.length === 0) {
    return { averageScore: 0, totalScore: 0 };
  }

  const totalScore = evaluations.reduce((teamTotal, evaluation) => {
    const evaluationTotal = evaluation.scores.reduce(
      (sum, score) => sum + score.score,
      0,
    );
    return teamTotal + evaluationTotal + evaluation.extraPoints;
  }, 0);

  const averageScore = totalScore / evaluations.length;

  return { averageScore, totalScore };
}

// Component for team stats
function TeamStats({
  memberCount,
  evaluationCount,
  averageScore,
  totalScore,
}: {
  memberCount: number;
  evaluationCount: number;
  averageScore: number;
  totalScore: number;
}) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-2">Team Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-bold">{memberCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Evaluations Received</p>
          <p className="text-2xl font-bold">{evaluationCount}</p>
        </div>
        {evaluationCount > 0 && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{averageScore.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-2xl font-bold">{totalScore.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component for evaluations - loaded separately
async function EvaluationsSection({ teamId }: { teamId: string }) {
  const evaluations = await getTeamEvaluations(teamId);

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const evalTotal = evaluation.scores.reduce(
              (sum, score) => sum + score.score,
              0,
            );
            return (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      Judge: {evaluation.judge.name}
                    </CardTitle>
                    <Badge>Total: {evalTotal + evaluation.extraPoints}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criterion</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluation.scores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {score.criterion.subject}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {score.criterion.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {score.score} / {score.criterion.fullMark}
                          </TableCell>
                        </TableRow>
                      ))}
                      {evaluation.extraPoints !== 0 && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Extra Points
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {evaluation.extraPoints}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {evaluation.extraJustification && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">Justification:</p>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.extraJustification}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for mentor feedback - loaded separately
async function MentorFeedbackSection({ teamId }: { teamId: string }) {
  const feedbacks = await getTeamMentorFeedbacks(teamId);

  if (feedbacks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {feedback.mentor.name}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeletons
function EvaluationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluations</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

function MentorFeedbackSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export default async function MyTeamPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Fetch only essential team data first
  const teamMembership = await getTeamMembership(session.user.id);

  if (!teamMembership) {
    return (
      <Page>
        <PageHeading title="My Team" />
        <PageContent>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                You are not assigned to any team yet.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  const team = teamMembership.team;
  const hasSubmission = !!team.submission;
  const evaluationCount = team._count.evaluations;

  // Fetch problem statements only if needed (no submission yet)
  const problemStatements =
    await getProblemStatementsForSubmission(hasSubmission);

  // Calculate statistics from evaluations (now done in server)
  const evaluations =
    evaluationCount > 0 ? await getTeamEvaluations(team.id) : [];
  const { averageScore, totalScore } = calculateTeamStatistics(evaluations);

  return (
    <Page>
      <PageHeading title={team.name} />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Team Members</h3>
                <div className="flex flex-wrap gap-2">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span>{member.user.name}</span>
                      <Badge
                        variant={
                          member.role === "LEAD" ? "default" : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <TeamStats
                memberCount={team.members.length}
                evaluationCount={evaluationCount}
                averageScore={averageScore}
                totalScore={totalScore}
              />
            </div>
          </CardContent>
        </Card>

        {team.submission ? (
          <SubmissionDetails
            submission={team.submission}
            problemStatements={problemStatements || []}
          />
        ) : (
          problemStatements && (
            <SubmissionForm problemStatements={problemStatements} />
          )
        )}

        {/* Stream evaluations separately */}
        {evaluationCount > 0 && (
          <Suspense fallback={<EvaluationsSkeleton />}>
            <EvaluationsSection teamId={team.id} />
          </Suspense>
        )}

        {/* Stream mentor feedback separately */}
        <Suspense fallback={<MentorFeedbackSkeleton />}>
          <MentorFeedbackSection teamId={team.id} />
        </Suspense>
      </PageContent>
    </Page>
  );
}
