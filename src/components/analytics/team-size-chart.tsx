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

interface TeamSizeChartProps {
  data: { size: string; count: number; fill: string }[];
}

export function TeamSizeChart({ data }: TeamSizeChartProps) {
  const chartConfig = {
    count: {
      label: "Count",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Size Distribution</CardTitle>
        <CardDescription>Number of teams by member count</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <XAxis dataKey="size" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
