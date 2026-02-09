/** @format */

import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardMentorProps {
  userId: string;
}

export async function DashboardMentor({ userId }: DashboardMentorProps) {
  // Get feedback given by this mentor
  const mentorFeedbacks = await prisma.mentorFeedback.findMany({
    where: { mentorId: userId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          submission: {
            include: {
              problemStatement: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get all teams for mentoring opportunities
  const allTeams = await prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      },
      submission: {
        include: {
          problemStatement: true,
        },
      },
      mentorFeedbacks: {
        where: {
          mentorId: userId,
        },
      },
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate statistics
  const totalFeedbackGiven = mentorFeedbacks.length;
  const teamsWithFeedback = new Set(mentorFeedbacks.map((f) => f.teamId)).size;
  const totalTeams = await prisma.team.count();

  // Get teams that have submissions but haven't received feedback from this mentor
  const teamsNeedingFeedback = allTeams.filter(
    (team) => team.submission && team.mentorFeedbacks.length === 0,
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTeams}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teams Mentored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{teamsWithFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Feedback Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalFeedbackGiven}</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Needing Feedback */}
      {teamsNeedingFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Teams Ready for Feedback</CardTitle>
              <Badge variant="outline">
                {teamsNeedingFeedback.length} team
                {teamsNeedingFeedback.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamsNeedingFeedback.slice(0, 5).map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {team.members.length} member
                      {team.members.length !== 1 ? "s" : ""}
                    </p>
                    {team.submission && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {team.submission.problemStatement.track}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {team.submission.problemStatement.title}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/mentors/feedback/${team.id}`}>
                      <Button size="sm">Give Feedback</Button>
                    </Link>
                    <Link href={`/teams/${team.id}`}>
                      <Button variant="outline" size="sm">
                        View Team
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedback Given */}
      {mentorFeedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mentorFeedbacks.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="border-l-2 pl-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">{feedback.team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feedback.team.members.length} member
                        {feedback.team.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{feedback.content}</p>
                  <Link href={`/teams/${feedback.teamId}`}>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      View Team →
                    </Button>
                  </Link>
                </div>
              ))}
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
            <Link href="/mentors">
              <Button variant="outline" className="w-full">
                View All Teams
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="w-full">
                Browse Teams
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
