/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export default async function MyTeamPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          evaluations: {
            where: {
              submittedAt: {
                not: null,
              },
            },
            include: {
              judge: true,
              scores: {
                include: {
                  criterion: true,
                },
              },
            },
          },
          mentorFeedbacks: {
            include: {
              mentor: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

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

  // Calculate average score
  const totalScore = team.evaluations.reduce((teamTotal, evaluation) => {
    const evaluationTotal = evaluation.scores.reduce(
      (sum, score) => sum + score.score,
      0,
    );
    return teamTotal + evaluationTotal + evaluation.extraPoints;
  }, 0);

  const averageScore =
    team.evaluations.length > 0 ? totalScore / team.evaluations.length : 0;

  return (
    <Page>
      <PageHeading
        title={team.name}
        badge={team.track && <Badge variant="outline">{team.track}</Badge>}
      />
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

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Team Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="text-2xl font-bold">{team.members.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Evaluations Received
                    </p>
                    <p className="text-2xl font-bold">
                      {team.evaluations.length}
                    </p>
                  </div>
                  {team.evaluations.length > 0 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Average Score
                        </p>
                        <p className="text-2xl font-bold">
                          {averageScore.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Score
                        </p>
                        <p className="text-2xl font-bold">
                          {totalScore.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {team.evaluations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.evaluations.map((evaluation) => {
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
                          <Badge>
                            Total: {evalTotal + evaluation.extraPoints}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Criterion</TableHead>
                              <TableHead className="text-right">
                                Score
                              </TableHead>
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
                            <p className="text-sm font-medium mb-1">
                              Justification:
                            </p>
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
        )}

        {team.mentorFeedbacks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mentor Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.mentorFeedbacks.map((feedback) => (
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
        )}
      </PageContent>
    </Page>
  );
}
