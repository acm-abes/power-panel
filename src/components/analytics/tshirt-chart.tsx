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
import { Shirt } from "lucide-react";

interface TshirtChartProps {
  data: { size: string; count: number; fill: string }[];
}

export function TshirtChart({ data }: TshirtChartProps) {
  const chartConfig = {
    count: {
      label: "Count",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shirt className="h-5 w-5" />
          T-Shirt Sizes
        </CardTitle>
        <CardDescription>Size distribution for planning</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="size"
              cx="50%"
              cy="50%"
              label={(entry) => `${entry.size}: ${entry.count}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
