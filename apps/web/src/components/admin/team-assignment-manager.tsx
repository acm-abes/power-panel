/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import {
  previewAssignmentsAction,
  confirmAssignmentsAction,
} from "@/server/actions/admin-allocation";
import { useRouter } from "next/navigation";
import { AssignmentConfigDialog } from "@/components/admin/assignment-config-dialog";

interface Panel {
  id: string;
  name: string;
  capacity: number;
  isLocked: boolean;
  _count: { judges: number; submissions: number };
  judges: { user: { id: string; name: string; trackPreferences: any } }[];
}

interface TeamAssignmentManagerProps {
  panels: Panel[];
  unassignedCount: number;
}

export function TeamAssignmentManager({
  panels,
  unassignedCount,
}: TeamAssignmentManagerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"idle" | "preview">("idle");
  const [previewAssignments, setPreviewAssignments] = useState<
    Record<string, string>
  >({});
  const [assignmentsByPanel, setAssignmentsByPanel] = useState<
    {
      panelId: string;
      panelName: string;
      capacity: number;
      currentLoad: number;
      newAssignments: number;
      assignments: {
        submissionId: string;
        teamName: string;
        teamCode: string;
        psTitle: string;
        track: string;
      }[];
    }[]
  >([]);
  const [assignmentStats, setAssignmentStats] = useState<{
    total: number;
    assigned: number;
  } | null>(null);
  const [assignmentStrategy, setAssignmentStrategy] = useState<
    "better-panel-first" | "equal-distribution"
  >("better-panel-first");
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerateAssignments(config: {
    strategy: "better-panel-first" | "equal-distribution";
  }) {
    setIsLoading(true);
    const result = await previewAssignmentsAction(config.strategy);
    setIsLoading(false);

    if (
      result.success &&
      result.assignments &&
      result.stats &&
      result.assignmentsByPanel
    ) {
      setPreviewAssignments(result.assignments);
      setAssignmentsByPanel(result.assignmentsByPanel);
      setAssignmentStats(result.stats);
      setAssignmentStrategy(config.strategy);
      setViewMode("preview");
      toast.success("Assignments calculated (Preview Mode)");
    } else {
      toast.error(result.error || "Failed to calculate assignments");
    }
  }

  async function handleConfirmAssignments() {
    setIsLoading(true);
    const result = await confirmAssignmentsAction(previewAssignments);
    setIsLoading(false);

    if (result.success) {
      toast.success("Submissions assigned to panels");
      setViewMode("idle");
      setPreviewAssignments({});
      setAssignmentsByPanel([]);
      setAssignmentStats(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save assignments");
    }
  }

  function handleDiscard() {
    setViewMode("idle");
    setPreviewAssignments({});
    setAssignmentsByPanel([]);
    setAssignmentStats(null);
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      {viewMode === "idle" && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Team Assignments</CardTitle>
            <CardDescription>
              Automatically assign unassigned submissions to panels based on
              track compatibility and panel capacity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentConfigDialog
              isLoading={isLoading}
              disabled={panels.length === 0 || unassignedCount === 0}
              onGenerate={handleGenerateAssignments}
            />
            {panels.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No panels available. Create panels first.
              </p>
            )}
            {unassignedCount === 0 && panels.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                All submissions are already assigned.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Preview */}
      {viewMode === "preview" && (
        <Card className="border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary">Assignment Preview</CardTitle>
            <CardDescription>
              Ready to assign {assignmentStats?.assigned} /{" "}
              {assignmentStats?.total} submissions to panels.
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleConfirmAssignments} disabled={isLoading}>
                <Check className="mr-2 h-4 w-4" /> Confirm Assignments
              </Button>
              <Button
                variant="ghost"
                onClick={handleDiscard}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {assignmentsByPanel.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No assignments generated. All submissions may be assigned or
                  no panels available.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {assignmentsByPanel.map((panel) => (
                  <AccordionItem value={panel.panelId} key={panel.panelId}>
                    <AccordionTrigger className="hover:no-underline px-2">
                      <div className="flex items-center gap-4 text-left w-full">
                        <span className="font-semibold text-lg">
                          {panel.panelName}
                        </span>
                        <div className="ml-auto mr-4 flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            +{panel.newAssignments} new
                          </Badge>
                          <Badge variant="secondary">
                            {panel.currentLoad + panel.newAssignments} /{" "}
                            {panel.capacity} capacity
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 p-4 bg-muted/30 rounded-md">
                        {panel.assignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No new assignments for this panel
                          </p>
                        ) : (
                          panel.assignments.map((assignment) => (
                            <div
                              key={assignment.submissionId}
                              className="flex justify-between items-center text-sm p-3 bg-background rounded border"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {assignment.teamName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {assignment.teamCode} • {assignment.psTitle}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  assignment.track === "AI"
                                    ? "border-blue-500 text-blue-500"
                                    : assignment.track === "Web3"
                                      ? "border-purple-500 text-purple-500"
                                      : "border-green-500 text-green-500"
                                }
                              >
                                {assignment.track}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
