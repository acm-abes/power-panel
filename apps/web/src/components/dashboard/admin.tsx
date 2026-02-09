/** @format */

import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function DashboardAdmin() {
  // Fetch all admin statistics in parallel
  const [
    totalUsers,
    totalTeams,
    totalSubmissions,
    totalJudges,
    totalMentors,
    totalParticipants,
    totalEvaluations,
    completedEvaluations,
    pendingEvaluations,
    recentUsers,
    recentTeams,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.submission.count(),
    prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: { name: "JUDGE" },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: { name: "MENTOR" },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: { name: "PARTICIPANT" },
          },
        },
      },
    }),
    prisma.evaluation.count(),
    prisma.evaluation.count({
      where: {
        submittedAt: { not: null },
      },
    }),
    prisma.judgeAssignment.count().then(async (total) => {
      const completed = await prisma.evaluation.count({
        where: { submittedAt: { not: null } },
      });
      return total - completed;
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    }),
    prisma.team.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        members: true,
        submission: true,
      },
    }),
  ]);

  const submissionRate = totalTeams > 0 ? ((totalSubmissions / totalTeams) * 100).toFixed(1) : "0";
  const evaluationProgress = totalEvaluations > 0 ? ((completedEvaluations / totalEvaluations) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalParticipants} participants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTeams}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSubmissions} submissions ({submissionRate}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Judges & Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalJudges + totalMentors}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalJudges} judges, {totalMentors} mentors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedEvaluations} / {totalEvaluations}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {evaluationProgress}% complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      {pendingEvaluations > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pending Actions</CardTitle>
              <Badge variant="outline">{pendingEvaluations} pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Pending Evaluations</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingEvaluations} team{pendingEvaluations !== 1 ? 's' : ''} waiting for evaluation
                  </p>
                </div>
                <Link href="/admin/evaluations">
                  <Button size="sm">View</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Users</CardTitle>
              <Link href="/admin/users">
                <Button variant="link" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-1">
                    {user.userRoles.map((ur) => (
                      <Badge key={ur.id} variant="secondary" className="text-xs">
                        {ur.role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Teams */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Teams</CardTitle>
              <Link href="/admin/teams">
                <Button variant="link" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{team.name}</p>
                      {team.submission && (
                        <Badge variant="outline" className="text-xs">Submitted</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link href={`/admin/teams/${team.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/roles">
              <Button variant="outline" className="w-full">
                Assign Roles
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/announcements">
              <Button variant="outline" className="w-full">
                Create Announcement
              </Button>
            </Link>
            <Link href="/admin/teams">
              <Button variant="outline" className="w-full">
                Manage Teams
              </Button>
            </Link>
            <Link href="/admin/judges">
              <Button variant="outline" className="w-full">
                Assign Judges
              </Button>
            </Link>
            <Link href="/admin/evaluations">
              <Button variant="outline" className="w-full">
                View Evaluations
              </Button>
            </Link>
            <Link href="/admin/submissions">
              <Button variant="outline" className="w-full">
                Review Submissions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
