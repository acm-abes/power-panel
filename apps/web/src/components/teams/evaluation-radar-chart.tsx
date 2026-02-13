/** @format */

"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CriterionScore {
  criterion: string;
  averageScore: number;
  maxScore: number;
}

interface EvaluationRadarChartProps {
  scores: CriterionScore[];
}

export function EvaluationRadarChart({ scores }: EvaluationRadarChartProps) {
  const data = scores.map((score) => ({
    criterion: score.criterion,
    score: score.averageScore,
    fullMark: score.maxScore,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Radar</CardTitle>
        <CardDescription>
          Average scores across all evaluation criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="criterion" className="text-xs" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Your Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-semibold">{data.criterion}</p>
                      <p className="text-sm text-muted-foreground">
                        Score: {data.score.toFixed(1)} / {data.fullMark}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
