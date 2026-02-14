/** @format */

"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { JudgePool } from "./judge-pool";
import { PanelColumn } from "./panel-column";
import { SubmissionQueue } from "./submission-queue";
import { CreatePanelDialog } from "./create-panel-dialog";
import { AssignmentSuggestionsDialog } from "./assignment-suggestions-dialog";
import { PanelValidationAlerts } from "./panel-validation-alerts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  assignJudgeToPanelAction,
  assignSubmissionToPanelAction,
  removeJudgeFromPanelAction,
  removeSubmissionFromPanelAction,
} from "@/server/actions/admin-allocation";

type Judge = {
  id: string;
  name: string;
  email: string;
  trackPreferences: { AI: number; Web3: number; Defense: number };
  inPanelId?: string;
  inPanelName?: string;
};

type Panel = {
  id: string;
  name: string;
  slotId: string;
  slotName: string;
  capacity: number;
  isLocked: boolean;
  isManual: boolean;
  notes?: string;
  judges: Judge[];
  submissions: Submission[];
  trackScores: { AI: number; Web3: number; Defense: number };
};

type Submission = {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  psTitle: string;
  track: string;
  isLocked: boolean;
};

type Slot = {
  id: string;
  name: string;
};

type DragItem = {
  type: "judge" | "submission";
  id: string;
  data: Judge | Submission;
};

type PanelBoardProps = {
  initialSlots: Slot[];
  initialPanels: Panel[];
  initialJudges: Judge[];
  initialSubmissions: Submission[];
};

// Normalize panel to ensure it has required arrays
// Handles both flat transformed panels and nested Prisma results
function normalizePanel(panel: any): Panel {
  // Transform judges if they're in Prisma format (with nested user)
  const judges = panel.judges
    ? panel.judges.map((j: any) => {
        // If already flat format, return as is
        if (j.name && j.email) return j;
        // If Prisma format, extract user data
        if (j.user) {
          return {
            id: j.user.id,
            name: j.user.name,
            email: j.user.email,
            trackPreferences: j.user.trackPreferences || {
              AI: 0,
              Web3: 0,
              Defense: 0,
            },
          };
        }
        return j;
      })
    : [];

  // Transform submissions if they're in Prisma format (with nested submission)
  const submissions = panel.submissions
    ? panel.submissions.map((s: any) => {
        // If already flat format, return as is
        if (s.teamName && s.psTitle) return s;
        // If Prisma format, extract submission data
        if (s.submission) {
          const sub = s.submission;
          return {
            id: sub.id,
            teamId: sub.teamId,
            teamName: sub.team?.name || "Unknown",
            teamCode: sub.team?.teamCode || "",
            psTitle: sub.problemStatement?.title || "Unknown",
            track: sub.problemStatement?.track || "AI",
            isLocked: s.isLocked || false,
          };
        }
        return s;
      })
    : [];

  return {
    id: panel.id,
    name: panel.name,
    slotId: panel.slotId || panel.slot?.id || "",
    slotName: panel.slotName || panel.slot?.name || "No Slot",
    capacity: panel.capacity || 5,
    isLocked: panel.isLocked || false,
    isManual: panel.isManual || false,
    notes: panel.notes || undefined,
    judges,
    submissions,
    trackScores: panel.trackScores || { AI: 0, Web3: 0, Defense: 0 },
  };
}

export function PanelBoard({
  initialSlots,
  initialPanels,
  initialJudges,
  initialSubmissions,
}: PanelBoardProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | "all">(
    initialSlots[0]?.id || "all",
  );
  const [panels, setPanels] = useState<Panel[]>(initialPanels);
  const [judges, setJudges] = useState<Judge[]>(initialJudges);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Filter panels by selected slot
  const filteredPanels =
    selectedSlotId === "all"
      ? panels
      : panels.filter((p) => p.slotId === selectedSlotId);

  // Filter judges by selected slot availability
  const availableJudges =
    selectedSlotId === "all"
      ? judges
      : judges.filter((j) => !j.inPanelId || j.inPanelId === selectedSlotId);

  // Unassigned submissions
  const unassignedSubmissions = initialSubmissions.filter(
    (s) =>
      !panels.some(
        (p) =>
          p.submissions?.some(
            (ps) => ps.id === s.id && ps.isLocked === false,
          ) ?? false,
      ),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current) {
      setActiveItem(active.data.current as DragItem);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over) return;

      const draggedItem = active.data.current as DragItem;
      const targetId = over.id as string;

      // Handle judge dragging to panel
      if (
        draggedItem.type === "judge" &&
        targetId.startsWith("panel-judges-")
      ) {
        const panelId = targetId.replace("panel-judges-", "");
        const judgeId = draggedItem.id;

        const result = await assignJudgeToPanelAction({
          judgeId,
          panelId,
          validateConflicts: true,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        // Optimistically update UI
        setPanels((prev) =>
          prev.map((p) => {
            if (p.id === panelId) {
              return {
                ...p,
                judges: [...(p.judges || []), draggedItem.data as Judge],
              };
            }
            return p;
          }),
        );

        setJudges((prev) =>
          prev.map((j) => {
            if (j.id === judgeId) {
              const panel = panels.find((p) => p.id === panelId);
              return { ...j, inPanelId: panelId, inPanelName: panel?.name };
            }
            return j;
          }),
        );

        toast.success("Judge assigned to panel");
        return;
      }

      // Handle submission dragging to panel
      if (
        draggedItem.type === "submission" &&
        targetId.startsWith("panel-submissions-")
      ) {
        const panelId = targetId.replace("panel-submissions-", "");
        const submissionId = draggedItem.id;

        const result = await assignSubmissionToPanelAction({
          submissionId,
          panelId,
          isLocked: false,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        // Optimistically update UI
        setPanels((prev) =>
          prev.map((p) => {
            if (p.id === panelId) {
              return {
                ...p,
                submissions: [
                  ...(p.submissions || []),
                  draggedItem.data as Submission,
                ],
              };
            }
            return p;
          }),
        );

        toast.success("Submission assigned to panel");
        return;
      }
    },
    [panels],
  );

  const handleRemoveJudge = useCallback(
    async (judgeId: string, panelId: string) => {
      const result = await removeJudgeFromPanelAction(judgeId, panelId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPanels((prev) =>
        prev.map((p) => {
          if (p.id === panelId) {
            return {
              ...p,
              judges: (p.judges || []).filter((j) => j.id !== judgeId),
            };
          }
          return p;
        }),
      );

      setJudges((prev) =>
        prev.map((j) => {
          if (j.id === judgeId) {
            return { ...j, inPanelId: undefined, inPanelName: undefined };
          }
          return j;
        }),
      );

      toast.success("Judge removed from panel");
    },
    [],
  );

  const handleRemoveSubmission = useCallback(
    async (submissionId: string, panelId: string) => {
      const result = await removeSubmissionFromPanelAction(
        submissionId,
        panelId,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPanels((prev) =>
        prev.map((p) => {
          if (p.id === panelId) {
            return {
              ...p,
              submissions: (p.submissions || []).filter(
                (s) => s.id !== submissionId,
              ),
            };
          }
          return p;
        }),
      );

      toast.success("Submission removed from panel");
    },
    [],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Select slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Slots</SelectItem>
              {initialSlots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  {slot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSuggestionsOpen(true)}
            disabled={unassignedSubmissions.length === 0}
          >
            <Wand2 className=" h-4 w-4" />
            Get Suggestions
          </Button>

          <Button variant="outline" onClick={() => setCreatePanelOpen(true)}>
            <Plus className=" h-4 w-4" />
            Create Panel
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      <PanelValidationAlerts
        panels={filteredPanels}
        unassignedCount={unassignedSubmissions.length}
      />

      {/* Main Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6">
          {/* Left Sidebar - Judge Pool */}
          <div className="w-96 shrink-0 border-r pr-6">
            <JudgePool
              judges={availableJudges}
              selectedSlotId={
                selectedSlotId === "all" ? undefined : selectedSlotId
              }
            />
          </div>

          {/* Center - Panel Columns (Vertical Stack) */}
          <div className="flex-1 flex flex-col gap-6 max-h-180 overflow-y-auto min-w-0 pr-2">
            {filteredPanels.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2 text-lg">No panels for this slot</p>
                  <Button onClick={() => setCreatePanelOpen(true)} size="lg">
                    <Plus className=" h-5 w-5" />
                    Create First Panel
                  </Button>
                </div>
              </div>
            ) : (
              filteredPanels.map((panel) => (
                <PanelColumn
                  key={panel.id}
                  panel={panel}
                  onRemoveJudge={handleRemoveJudge}
                  onRemoveSubmission={handleRemoveSubmission}
                  onUpdate={(updatedPanel: Panel) => {
                    setPanels((prev) =>
                      prev.map((p) => (p.id === panel.id ? updatedPanel : p)),
                    );
                  }}
                  onDelete={(panelId: string) => {
                    setPanels((prev) => prev.filter((p) => p.id !== panelId));
                  }}
                />
              ))
            )}
          </div>

          {/* Right Sidebar - Submission Queue */}
          <div className="w-96 shrink-0 border-l pl-6">
            <SubmissionQueue submissions={unassignedSubmissions} />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="rounded-lg border bg-background p-3 shadow-lg">
              {activeItem.type === "judge" ? (
                <div>
                  <p className="font-medium">
                    {(activeItem.data as Judge).name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(activeItem.data as Judge).email}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {(activeItem.data as Submission).teamName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(activeItem.data as Submission).psTitle}
                  </p>
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <CreatePanelDialog
        open={createPanelOpen}
        onOpenChange={setCreatePanelOpen}
        slots={initialSlots}
        onPanelCreated={(panel: any) => {
          setPanels((prev) => [...prev, normalizePanel(panel)]);
          setCreatePanelOpen(false);
        }}
      />

      <AssignmentSuggestionsDialog
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
        slotId={selectedSlotId === "all" ? undefined : selectedSlotId}
        onApplySuggestions={() => {
          // Refresh data
          window.location.reload();
        }}
      />
    </div>
  );
}
