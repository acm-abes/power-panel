/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/actions/get-analytics-data";
import { Page, PageHeading, PageContent } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Building2,
  Code,
  TrendingUp,
  Utensils,
  UsersRound,
} from "lucide-react";
import { headers } from "next/headers";
import { GraduationYearChart } from "@/components/analytics/graduation-year-chart";
import { EducationCharts } from "@/components/analytics/education-charts";
import { ExperienceRoleCharts } from "@/components/analytics/experience-role-charts";
import { TeamSizeChart } from "@/components/analytics/team-size-chart";
import { TshirtChart } from "@/components/analytics/tshirt-chart";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) {
    redirect("/");
  }

  const stats = await getAnalyticsData();

  // Prepare chart data
  const graduationYearChartData = Object.entries(stats.graduationYears)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({
      year,
      count,
    }));

  const educationLevelChartData = Object.entries(stats.educationLevels)
    .sort(([, a], [, b]) => b - a)
    .map(([level, count]) => ({
      level: level.replace("_", " "),
      count,
    }));

  const degreeTypeChartData = Object.entries(stats.degreeTypes)
    .sort(([, a], [, b]) => b - a)
    .map(([degree, count]) => ({
      degree: degree.replace("_", " "),
      count,
    }));

  const hackathonExpChartData = Object.entries(stats.hackathonExp)
    .sort(([, a], [, b]) => b - a)
    .map(([exp, count]) => ({
      experience: exp.replace(/_/g, " "),
      count,
    }));

  const interestedRolesChartData = Object.entries(stats.interestedRoles)
    .sort(([, a], [, b]) => b - a)
    .map(([role, count]) => ({
      role: role.replace(/_/g, " "),
      count,
    }));

  const teamSizeChartData = Object.entries(stats.teamSizeDistribution)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([size, count]) => ({
      size: `${size} member${Number(size) !== 1 ? "s" : ""}`,
      count,
    }));

  const tshirtChartData = Object.entries(stats.tshirtSizes)
    .sort(([a], [b]) => {
      const order = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      return order.indexOf(a) - order.indexOf(b);
    })
    .map(([size, count]) => ({
      size,
      count,
    }));

  return (
    <Page>
      <PageHeading
        title="Analytics Dashboard"
        badge={<Badge variant="outline">{stats.total} Participants</Badge>}
      />
      <PageContent>
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Participants
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <UsersRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueTeams}</div>
              <p className="text-xs text-muted-foreground">
                Avg size: {stats.avgTeamSize.toFixed(1)} members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Teams Submitted
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamsSubmitted}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.teamsSubmitted / stats.uniqueTeams) * 100).toFixed(1)}%
                submission rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                GitHub Profiles
              </CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithGithub}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.usersWithGithub / stats.total) * 100).toFixed(1)}% have
                GitHub
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Positions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(stats.positions)
                .sort(([, a], [, b]) => b - a)
                .map(([position, count]) => (
                  <div
                    key={position}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium capitalize">
                      {position.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({((count / stats.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Education Charts */}
        <div className="mb-6">
          <EducationCharts
            educationLevelData={educationLevelChartData}
            degreeTypeData={degreeTypeChartData}
          />
        </div>

        {/* Graduation Years Chart */}
        <div className="mb-6">
          <GraduationYearChart data={graduationYearChartData} />
        </div>

        {/* Top Colleges */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top 10 Colleges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topColleges.map(([college, count], index) => (
                <div key={college}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{college}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {count} ({((count / stats.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(count / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience and Interests Charts */}
        <div className="mb-6">
          <ExperienceRoleCharts
            hackathonExpData={hackathonExpChartData}
            interestedRolesData={interestedRolesChartData}
          />
        </div>

        {/* Team Size Chart */}
        <div className="mb-6">
          <TeamSizeChart data={teamSizeChartData} />
        </div>

        {/* Logistics */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <TshirtChart data={tshirtChartData} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dietary Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.dietaryRestrictions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([restriction, count]) => (
                    <div key={restriction}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm capitalize">
                          {restriction}
                        </span>
                        <span className="text-sm font-medium">
                          {count} ({((count / stats.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(count / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Developer Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      GitHub Profiles
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.usersWithGithub}
                    </p>
                  </div>
                  <Code className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(stats.usersWithGithub / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats.usersWithGithub / stats.total) * 100).toFixed(1)}%
                    of participants
                  </p>
                </div>
              </div>

              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Portfolio Websites
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.usersWithPortfolio}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(stats.usersWithPortfolio / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats.usersWithPortfolio / stats.total) * 100).toFixed(
                      1,
                    )}
                    % of participants
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
