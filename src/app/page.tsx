/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Page, PageHeading, PageContent } from "@/components/page";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const roles = await getUserRoles(session.user.id);

  // Fetch relevant stats based on roles
  const [totalUsers, totalTeams, totalJudges, totalEvaluations] =
    await Promise.all([
      roles.isAdmin ? prisma.user.count() : Promise.resolve(0),
      prisma.team.count(),
      roles.isAdmin
        ? prisma.user.count({
            where: {
              userRoles: {
                some: {
                  role: { name: "JUDGE" },
                },
              },
            },
          })
        : Promise.resolve(0),
      roles.isAdmin
        ? prisma.evaluation.count({
            where: {
              submittedAt: { not: null },
            },
          })
        : Promise.resolve(0),
    ]);

  // Get user's team if participant
  const userTeam = roles.isParticipant
    ? await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        include: {
          team: {
            include: {
              members: true,
            },
          },
        },
      })
    : null;

  // Get judge's assignments and progress
  const judgeAssignments = roles.isJudge
    ? await prisma.judgeAssignment.count({
        where: { judgeId: session.user.id },
      })
    : 0;

  const judgeCompletedEvaluations = roles.isJudge
    ? await prisma.evaluation.count({
        where: {
          judgeId: session.user.id,
          submittedAt: { not: null },
        },
      })
    : 0;

  // Get recent announcements
  const announcements = await prisma.announcement.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
    },
  });

  return (
    <Page>
      <PageHeading
        title="Dashboard"
        description={`Welcome back, ${session.user.name}`}
        badge={
          <div className="flex gap-2">
            {roles.isAdmin && <Badge>Admin</Badge>}
            {roles.isJudge && <Badge variant="secondary">Judge</Badge>}
            {roles.isMentor && <Badge variant="secondary">Mentor</Badge>}
            {roles.isParticipant && (
              <Badge variant="secondary">Participant</Badge>
            )}
          </div>
        }
      />

      <PageContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.isAdmin && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Judges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalJudges}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Evaluations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalEvaluations}</p>
                </CardContent>
              </Card>
            </>
          )}

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

          {roles.isJudge && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assigned Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{judgeAssignments}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed Evaluations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {judgeCompletedEvaluations} / {judgeAssignments}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* User's Team Info for Participants */}
        {roles.isParticipant && userTeam && (
          <Card>
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">{userTeam.team.name}</span>
                  {userTeam.team.track && (
                    <Badge variant="outline" className="ml-2">
                      {userTeam.team.track}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {userTeam.team.members.length} member
                    {userTeam.team.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Announcements */}
        {announcements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-2 pl-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      By {announcement.creator.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </Page>
  );
}
