/** @format */

"use client";

import { useState } from "react";
import { GeneratedPanel } from "@power/allocation";
import { Panel } from "@power/db";
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
import { Loader2, Check, X, Wand2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  previewPanelsAction,
  confirmPanelsAction,
  previewAssignmentsAction,
  confirmAssignmentsAction,
} from "@/server/actions/admin-allocation";
import { useRouter } from "next/navigation";

interface PanelManagerProps {
  initialPanels: (Panel & {
    _count: { judges: number; submissions: number };
    judges: { user: { id: string; name: string; trackPreferences: any } }[];
  })[];
}

export function PanelManager({ initialPanels }: PanelManagerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<
    "list" | "preview-panels" | "preview-assignments"
  >("list");
  const [previewPanels, setPreviewPanels] = useState<GeneratedPanel[]>([]);
  const [previewAssignments, setPreviewAssignments] = useState<
    Record<string, string>
  >({});
  const [assignmentStats, setAssignmentStats] = useState<{
    total: number;
    assigned: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGeneratePanels() {
    setIsLoading(true);
    const result = await previewPanelsAction({ judgesPerPanel: 3 }); // Default config
    setIsLoading(false);

    if (result.success && result.panels) {
      setPreviewPanels(result.panels);
      setViewMode("preview-panels");
      toast.success("Panels generated successfully (Preview Mode)");
    } else {
      toast.error(result.error || "Failed to generate panels");
    }
  }

  async function handleConfirmPanels() {
    setIsLoading(true);
    const result = await confirmPanelsAction(previewPanels);
    setIsLoading(false);

    if (result.success) {
      toast.success("Panels saved to database");
      setViewMode("list");
      setPreviewPanels([]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save panels");
    }
  }

  async function handleGenerateAssignments() {
    setIsLoading(true);
    const result = await previewAssignmentsAction();
    setIsLoading(false);

    if (result.success && result.assignments && result.stats) {
      setPreviewAssignments(result.assignments);
      setAssignmentStats(result.stats);
      setViewMode("preview-assignments");
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
      setViewMode("list");
      setPreviewAssignments({});
      setAssignmentStats(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save assignments");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {viewMode === "list" && (
          <>
            <Button onClick={handleGeneratePanels} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Auto-Generate Panels
            </Button>
            <Button
              onClick={handleGenerateAssignments}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Assign Teams
            </Button>
          </>
        )}
      </div>

      {viewMode === "preview-panels" && (
        <Card className="border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary">
              Previewing {previewPanels.length} Generated Panels
            </CardTitle>
            <CardDescription>
              Review the proposed panel structure before saving. Does not affect
              current data.
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleConfirmPanels} disabled={isLoading}>
                <Check className="mr-2 h-4 w-4" /> Confirm & Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode("list")}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {previewPanels.map((panel, idx) => (
                <AccordionItem value={`preview-${idx}`} key={idx}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 text-left">
                      <span className="font-semibold">Panel {panel.id}</span>
                      <div className="flex gap-2">
                        {panel.trackScore.AI > 0 && (
                          <Badge variant="outline">
                            AI: {panel.trackScore.AI.toFixed(1)}
                          </Badge>
                        )}
                        {panel.trackScore.Web3 > 0 && (
                          <Badge variant="outline">
                            Web3: {panel.trackScore.Web3.toFixed(1)}
                          </Badge>
                        )}
                        {panel.trackScore.Defense > 0 && (
                          <Badge variant="outline">
                            Def: {panel.trackScore.Defense.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {panel.judges.length} Judges
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4 border-l-2">
                      {panel.judges.map((j) => (
                        <div
                          key={j.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{j.name}</span>
                          <span className="text-muted-foreground text-xs">
                            AI: {j.trackPreferences.AI}, W3:{" "}
                            {j.trackPreferences.Web3}, Def:{" "}
                            {j.trackPreferences.Defense}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {viewMode === "preview-assignments" && (
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
                onClick={() => setViewMode("list")}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Existing Database Panels (Read-Only List) */}
      {viewMode === "list" && (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Current Panels</h2>
          {initialPanels.length === 0 ? (
            <p className="text-muted-foreground">
              No panels found. Generate some above.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {initialPanels.map((panel) => (
                <AccordionItem value={panel.id} key={panel.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 text-left">
                      <span className="font-semibold">{panel.name}</span>
                      <Badge
                        variant={panel.isLocked ? "destructive" : "default"}
                      >
                        {panel.isLocked ? "Locked" : "Active"}
                      </Badge>
                      <Badge variant="secondary">{panel.capacity} Cap</Badge>
                      <span className="text-xs text-muted-foreground">
                        {panel._count.judges} Judges •{" "}
                        {panel._count.submissions} Submissions
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Judges</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {panel.judges.map((pj) => (
                              <li key={pj.user.id}>
                                {pj.user.name}
                                <span className="text-muted-foreground ml-2 text-xs">
                                  (AI:{pj.user.trackPreferences?.AI ?? 0}, W3:
                                  {pj.user.trackPreferences?.Web3 ?? 0}, D:
                                  {pj.user.trackPreferences?.Defense ?? 0})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Future: List submissions here too */}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
