/** @format */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

interface ExperienceRoleChartsProps {
  hackathonExpData: { experience: string; count: number; fill: string }[];
  interestedRolesData: { role: string; count: number; fill: string }[];
}

export function ExperienceRoleCharts({
  hackathonExpData,
  interestedRolesData,
}: ExperienceRoleChartsProps) {
  const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hackathon Experience
          </CardTitle>
          <CardDescription>Previous hackathon participation</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={hackathonExpData} layout="vertical">
              <XAxis type="number" />
              <YAxis
                dataKey="experience"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {hackathonExpData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interested Roles</CardTitle>
          <CardDescription>Role preferences of participants</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={interestedRolesData} layout="vertical">
              <XAxis type="number" />
              <YAxis
                dataKey="role"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {interestedRolesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
