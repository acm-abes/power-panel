/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import {
  getJudgeAvailableSlotsAction,
  getJudgeEvaluationDataAction,
} from "@/server/actions/judge-evaluation";

interface EvaluationSlot {
  id: string;
  name: string;
  day: number;
  startTime: string;
  endTime: string;
}

interface TeamData {
  id: string;
  name: string;
  teamCode: string;
  submission: {
    id: string;
    problemStatement: string;
    track: string;
    panelId: string;
    panelName: string;
  } | null;
  hasEvaluation: boolean;
  isSubmitted: boolean;
}

export function JudgeEvaluationClient() {
  const router = useRouter();
  const [slots, setSlots] = useState<EvaluationSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);

  async function loadSlots() {
    const result = await getJudgeAvailableSlotsAction();
    if (result.success && result.slots) {
      setSlots(result.slots);
      if (result.slots.length > 0) {
        setSelectedSlot(result.slots[0].id);
      }
    }
    setLoading(false);
  }

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    const result = await getJudgeEvaluationDataAction(selectedSlot);
    if (result.success && result.teams) {
      setTeams(result.teams);
    }
    setLoadingTeams(false);
  }, [selectedSlot]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, []);

  useEffect(() => {
    if (selectedSlot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTeams();
    }
  }, [loadTeams, selectedSlot]);

  const pendingTeams = teams.filter((t) => !t.isSubmitted);
  const completedTeams = teams.filter((t) => t.isSubmitted);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No evaluation slots assigned to you. Please contact an
            administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Evaluation Slot</CardTitle>
          <CardDescription>
            Choose the time slot for which you want to evaluate teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSlot} onValueChange={setSelectedSlot}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a slot" />
            </SelectTrigger>
            <SelectContent>
              {slots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{slot.name}</span>
                    <span className="text-muted-foreground text-sm">
                      Day {slot.day} • {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loadingTeams ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Evaluations</CardTitle>
                <CardDescription>Teams waiting for your review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingTeams.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>
                  Evaluations you&apos;ve submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {completedTeams.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Teams to Evaluate</h2>
              {pendingTeams.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No pending evaluations for this slot. Great job!
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingTeams.map((team) => (
                    <Card key={team.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{team.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Team Code: {team.teamCode}
                            </CardDescription>
                          </div>
                          {team.hasEvaluation && (
                            <Badge variant="outline">
                              <Clock className="mr-1 h-3 w-3" />
                              Draft Saved
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {team.submission && (
                          <div className="mb-4 space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Problem:
                              </span>
                              <span className="font-medium">
                                {team.submission.problemStatement}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Track:
                              </span>
                              <Badge variant="secondary">
                                {team.submission.track}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Panel:
                              </span>
                              <span className="font-medium">
                                {team.submission.panelName}
                              </span>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() =>
                            router.push(
                              `/judges/evaluate/${team.id}?slot=${selectedSlot}`,
                            )
                          }
                          className="w-full"
                        >
                          {team.hasEvaluation
                            ? "Continue Evaluation"
                            : "Start Evaluation"}{" "}
                          →
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {completedTeams.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Completed Evaluations
                </h2>
                <div className="grid gap-4">
                  {completedTeams.map((team) => (
                    <Card key={team.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{team.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Team Code: {team.teamCode}
                            </CardDescription>
                          </div>
                          <Badge variant="default">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Submitted
                          </Badge>
                        </div>
                      </CardHeader>
                      {team.submission && (
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Problem:
                              </span>
                              <span className="font-medium">
                                {team.submission.problemStatement}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Track:
                              </span>
                              <Badge variant="secondary">
                                {team.submission.track}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
