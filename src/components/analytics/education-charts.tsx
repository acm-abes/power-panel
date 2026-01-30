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
import { Cell, Pie, PieChart } from "recharts";
import { Award, GraduationCap } from "lucide-react";

interface EducationChartsProps {
  educationLevelData: { level: string; count: number; fill: string }[];
  degreeTypeData: { degree: string; count: number; fill: string }[];
}

export function EducationCharts({
  educationLevelData,
  degreeTypeData,
}: EducationChartsProps) {
  const chartConfig = {
    count: {
      label: "Count",
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education Level
          </CardTitle>
          <CardDescription>Distribution by education level</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={educationLevelData}
                dataKey="count"
                nameKey="level"
                cx="50%"
                cy="50%"
                label={(entry) => `${entry.level}: ${entry.count}`}
              >
                {educationLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Degree Types
          </CardTitle>
          <CardDescription>Distribution by degree type</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={degreeTypeData}
                dataKey="count"
                nameKey="degree"
                cx="50%"
                cy="50%"
                label={(entry) => `${entry.degree}: ${entry.count}`}
              >
                {degreeTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
