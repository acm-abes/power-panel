/** @format */

import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardParticipantProps {
  userId: string;
}

export async function DashboardParticipant({
  userId,
}: DashboardParticipantProps) {
  // Get user's team with all details
  const teamMembership = await prisma.teamMember.findFirst({
    where: { userId },
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
          mentorFeedbacks: {
            include: {
              mentor: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
        },
      },
    },
  });

  if (!teamMembership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Team Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are not part of any team yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact an administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { team } = teamMembership;
  const hasSubmission = !!team.submission;

  return (
    <div className="space-y-6">
      {/* Team Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Team Code/Team Id:{" "}
                <span className="font-mono">{team.teamCode}</span>
              </p>
            </div>
            <Badge
              variant={teamMembership.role === "LEAD" ? "default" : "secondary"}
            >
              {teamMembership.role === "LEAD" ? "Team Lead" : "Member"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">
                Team Members ({team.members.length})
              </h4>
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{member.user.name}</span>
                      {member.role === "LEAD" && (
                        <Badge variant="outline" className="text-xs">
                          Lead
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {member.user.email}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent>
          {hasSubmission && team.submission ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {team.submission.problemStatement.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Track: {team.submission.problemStatement.track}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Provider: {team.submission.problemStatement.provider}
                  </p>
                </div>
                <Badge variant="default">Submitted</Badge>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Submitted on:{" "}
                  {new Date(team.submission.submittedAt).toLocaleDateString()}
                </p>
                {team.submission.isLocked && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <Badge variant="secondary">Locked</Badge>
                    <span>No further changes allowed</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/teams/my-team`}>
                  <Button variant="outline" size="sm">
                    View Submission
                  </Button>
                </Link>
                {!team.submission.isLocked && (
                  <Link href={`/teams/my-team`}>
                    <Button size="sm">Update Submission</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You haven&apos;t submitted your project yet.
              </p>
              <Link href="/teams/my-team">
                <Button>Create your Submission</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="https://smartabeshackathon.tech/problem-statements"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                Browse Problem Statements
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Feedback */}
      {team.mentorFeedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Mentor Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {team.mentorFeedbacks.map((feedback) => (
                <div key={feedback.id} className="border-l-2 pl-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      {feedback.mentor.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feedback.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
