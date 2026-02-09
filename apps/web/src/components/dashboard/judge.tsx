/** @format */

import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardJudgeProps {
  userId: string;
}

export async function DashboardJudge({ userId }: DashboardJudgeProps) {
  // Get judge assignments with team details and evaluation status
  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: userId },
    include: {
      team: {
        include: {
          submission: {
            include: {
              problemStatement: true,
            },
          },
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Get evaluations by this judge
  const evaluations = await prisma.evaluation.findMany({
    where: { judgeId: userId },
    include: {
      team: true,
      scores: {
        include: {
          criterion: true,
        },
      },
    },
  });

  // Create a map of team evaluations
  const evaluationMap = new Map(evaluations.map((ev) => [ev.teamId, ev]));

  // Calculate statistics
  const totalAssignments = assignments.length;
  const completedEvaluations = evaluations.filter(
    (e) => e.submittedAt !== null,
  ).length;
  const pendingEvaluations = totalAssignments - completedEvaluations;

  // Separate pending and completed assignments
  const pendingAssignments = assignments.filter(
    (a) =>
      !evaluationMap.has(a.teamId) || !evaluationMap.get(a.teamId)?.submittedAt,
  );
  const completedAssignments = assignments.filter(
    (a) =>
      evaluationMap.has(a.teamId) && evaluationMap.get(a.teamId)?.submittedAt,
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAssignments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {pendingEvaluations}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {completedEvaluations}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Evaluations */}
      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pending Evaluations</CardTitle>
              <Badge variant="outline">
                {pendingAssignments.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => {
                const hasSubmission = !!assignment.team.submission;
                const evaluation = evaluationMap.get(assignment.teamId);
                const isDraft = evaluation && !evaluation.submittedAt;

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{assignment.team.name}</h4>
                        {isDraft && (
                          <Badge variant="secondary">Draft Saved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.team.members.length} member
                        {assignment.team.members.length !== 1 ? "s" : ""}
                      </p>
                      {hasSubmission && assignment.team.submission && (
                        <p className="text-sm text-muted-foreground">
                          Problem:{" "}
                          {assignment.team.submission.problemStatement.title}
                        </p>
                      )}
                      {!hasSubmission && (
                        <Badge variant="outline" className="text-xs">
                          No submission yet
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {hasSubmission && (
                        <Link href={`/judges/evaluate/${assignment.teamId}`}>
                          <Button size="sm">
                            {isDraft ? "Continue" : "Evaluate"}
                          </Button>
                        </Link>
                      )}
                      <Link href={`/teams/${assignment.teamId}`}>
                        <Button variant="outline" size="sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Evaluations */}
      {completedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Completed Evaluations</CardTitle>
              <Badge variant="outline">
                {completedAssignments.length} completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedAssignments.slice(0, 5).map((assignment) => {
                const evaluation = evaluationMap.get(assignment.teamId);
                const totalScore = evaluation
                  ? evaluation.scores.reduce((sum, s) => sum + s.score, 0) +
                    evaluation.extraPoints
                  : 0;

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{assignment.team.name}</h4>
                        <Badge variant="default">Evaluated</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Score: {totalScore} points
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted:{" "}
                        {evaluation?.submittedAt
                          ? new Date(
                              evaluation.submittedAt,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/judges/evaluate/${assignment.teamId}`}>
                        <Button variant="outline" size="sm">
                          View Evaluation
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/judges">
              <Button variant="outline" className="w-full">
                View All Assignments
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="w-full">
                Browse All Teams
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
