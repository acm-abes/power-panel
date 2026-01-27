/** @format */

import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Page, PageHeading, PageContent } from "@/components/page";

export default async function ResultsPage() {
  const teams = await prisma.team.findMany({
    include: {
      evaluations: {
        include: {
          judge: true,
          scores: {
            include: {
              criterion: true,
            },
          },
        },
        where: {
          submittedAt: {
            not: null,
          },
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate total scores for each team
  const teamsWithScores = teams.map((team) => {
    const totalScore = team.evaluations.reduce((teamTotal, evaluation) => {
      const evaluationTotal = evaluation.scores.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      return teamTotal + evaluationTotal + evaluation.extraPoints;
    }, 0);

    const evaluationCount = team.evaluations.length;
    const averageScore = evaluationCount > 0 ? totalScore / evaluationCount : 0;

    return {
      ...team,
      totalScore,
      averageScore,
      evaluationCount,
    };
  });

  // Sort by average score descending
  teamsWithScores.sort((a, b) => b.averageScore - a.averageScore);

  return (
    <Page>
      <PageHeading
        title="Evaluation Results"
        description="Team rankings and detailed scores"
      />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Evaluations</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsWithScores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No evaluation data available
                    </TableCell>
                  </TableRow>
                ) : (
                  teamsWithScores.map((team, index) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{index + 1}</span>
                          {index === 0 && team.averageScore > 0 && (
                            <Badge variant="default">🥇</Badge>
                          )}
                          {index === 1 && team.averageScore > 0 && (
                            <Badge variant="secondary">🥈</Badge>
                          )}
                          {index === 2 && team.averageScore > 0 && (
                            <Badge variant="outline">🥉</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {team.members.length} member
                            {team.members.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.track ? (
                          <Badge variant="outline">{team.track}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            team.evaluationCount > 0 ? "default" : "secondary"
                          }
                        >
                          {team.evaluationCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {team.averageScore.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{team.totalScore.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {teamsWithScores.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Scores by Team
                </h3>
                <div className="space-y-6">
                  {teamsWithScores.map((team) => (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {team.name} - Evaluations ({team.evaluations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {team.evaluations.length === 0 ? (
                          <p className="text-muted-foreground">
                            No evaluations submitted
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {team.evaluations.map((evaluation) => {
                              const evalTotal = evaluation.scores.reduce(
                                (sum, score) => sum + score.score,
                                0,
                              );
                              return (
                                <div
                                  key={evaluation.id}
                                  className="border-l-2 pl-4"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">
                                      {evaluation.judge.name}
                                    </span>
                                    <Badge>
                                      Total:{" "}
                                      {evalTotal + evaluation.extraPoints}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    {evaluation.scores.map((score) => (
                                      <div
                                        key={score.id}
                                        className="flex justify-between"
                                      >
                                        <span className="text-muted-foreground">
                                          {score.criterion.subject}
                                        </span>
                                        <span>
                                          {score.score} /{" "}
                                          {score.criterion.fullMark}
                                        </span>
                                      </div>
                                    ))}
                                    {evaluation.extraPoints !== 0 && (
                                      <div className="flex justify-between font-medium">
                                        <span>Extra Points</span>
                                        <span>{evaluation.extraPoints}</span>
                                      </div>
                                    )}
                                  </div>
                                  {evaluation.extraJustification && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {evaluation.extraJustification}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
