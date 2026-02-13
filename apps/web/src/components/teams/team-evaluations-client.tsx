/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { EvaluationRadarChart } from "@/components/teams/evaluation-radar-chart";
import { JudgeFeedbackList } from "@/components/teams/judge-feedback-list";
import { getTeamEvaluationResults } from "@/server/actions/team-evaluation-results";

interface TeamEvaluationsClientProps {
  teamId: string;
}

export function TeamEvaluationsClient({ teamId }: TeamEvaluationsClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadEvaluations = useCallback(async () => {
    setLoading(true);
    const result = await getTeamEvaluationResults(teamId);
    if (result.success) {
      setData(result);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvaluations();
  }, [loadEvaluations, teamId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.judgeCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluations</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No evaluations submitted yet. Judges will evaluate your team during
          the designated evaluation slots.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Judges Evaluated
              </div>
              <div className="text-3xl font-bold">{data.judgeCount}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Average Score
              </div>
              <div className="text-3xl font-bold text-primary">
                {data.averageScore}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Total Score
              </div>
              <div className="text-3xl font-bold">{data.totalScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      {data.radarData.length > 0 && (
        <EvaluationRadarChart scores={data.radarData} />
      )}

      {/* Judge Feedback */}
      <JudgeFeedbackList evaluations={data.evaluations} />
    </div>
  );
}
