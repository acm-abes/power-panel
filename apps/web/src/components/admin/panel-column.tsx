/** @format */

"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Unlock,
  Trash2,
  X,
  Edit2,
  Check,
  LockKeyhole,
  LockOpen,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  updatePanelAction,
  togglePanelLock,
  toggleAssignmentLock,
} from "@/server/actions/admin-allocation";

type Judge = {
  id: string;
  name: string;
  email: string;
  trackPreferences: { AI: number; Web3: number; Defense: number };
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

type PanelColumnProps = {
  panel: Panel;
  onRemoveJudge: (judgeId: string, panelId: string) => void;
  onRemoveSubmission: (submissionId: string, panelId: string) => void;
  onUpdate: (panel: Panel) => void;
};

export function PanelColumn({
  panel,
  onRemoveJudge,
  onRemoveSubmission,
  onUpdate,
}: PanelColumnProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(panel.name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const judgesDroppable = useDroppable({
    id: `panel-judges-${panel.id}`,
    disabled: panel.isLocked,
  });

  const submissionsDroppable = useDroppable({
    id: `panel-submissions-${panel.id}`,
    disabled: panel.isLocked,
  });

  const isOverCapacity = panel.submissions.length > panel.capacity;
  const hasNoJudges = panel.judges.length === 0;

  const handleSaveName = async () => {
    if (editedName.trim() === "" || editedName === panel.name) {
      setIsEditingName(false);
      setEditedName(panel.name);
      return;
    }

    const result = await updatePanelAction(panel.id, { name: editedName });

    if (result.error) {
      toast.error(result.error);
      setEditedName(panel.name);
    } else {
      onUpdate({ ...panel, name: editedName });
      toast.success("Panel name updated");
    }

    setIsEditingName(false);
  };

  const handleToggleLock = async () => {
    const result = await togglePanelLock(panel.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      onUpdate({ ...panel, isLocked: result.isLocked! });
      toast.success(result.isLocked ? "Panel locked" : "Panel unlocked");
    }
  };

  const handleToggleSubmissionLock = async (submissionId: string) => {
    const result = await toggleAssignmentLock(submissionId, panel.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      onUpdate({
        ...panel,
        submissions: panel.submissions.map((s) =>
          s.id === submissionId ? { ...s, isLocked: result.isLocked! } : s,
        ),
      });
      toast.success(
        result.isLocked ? "Assignment locked" : "Assignment unlocked",
      );
    }
  };

  const handleDeletePanel = async () => {
    // This would call a delete panel action
    toast.info("Delete panel functionality to be implemented");
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        className={`w-96 shrink-0 flex flex-col ${
          panel.isLocked ? "bg-muted/30" : ""
        } ${isOverCapacity ? "border-destructive" : ""} ${
          hasNoJudges && panel.submissions.length > 0 ? "border-yellow-500" : ""
        }`}
      >
        <CardHeader className="space-y-2 pb-3">
          {/* Panel Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setEditedName(panel.name);
                      }
                    }}
                    className="h-8 text-lg font-semibold"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate">{panel.name}</CardTitle>
                  {!panel.isLocked && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                      className="h-6 w-6"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {panel.slotName}
                </Badge>
                {panel.isManual && (
                  <Badge variant="secondary" className="text-xs">
                    Manual
                  </Badge>
                )}
                {panel.isLocked && (
                  <Badge variant="destructive" className="text-xs">
                    <Lock className="mr-1 h-3 w-3" />
                    Locked
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleToggleLock}
                className="h-8 w-8"
              >
                {panel.isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={panel.isLocked}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Capacity & Track Scores */}
          <div className="space-y-1">
            <div className="text-sm">
              <span
                className={
                  isOverCapacity ? "font-semibold text-destructive" : ""
                }
              >
                {panel.submissions.length}/{panel.capacity}
              </span>
              <span className="text-muted-foreground"> submissions</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {panel.trackScores.AI > 0 && (
                <Badge variant="secondary" className="text-xs">
                  AI: {panel.trackScores.AI}
                </Badge>
              )}
              {panel.trackScores.Web3 > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Web3: {panel.trackScores.Web3}
                </Badge>
              )}
              {panel.trackScores.Defense > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Defense: {panel.trackScores.Defense}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          {/* Judges Section */}
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Judges ({panel.judges.length})
            </h4>
            {/* eslint-disable-next-line react-compiler/react-compiler */}
            <div
              ref={judgesDroppable.setNodeRef}
              className={`min-h-25 rounded-md border-2 border-dashed p-2 space-y-2 ${
                judgesDroppable.isOver ? "border-primary bg-primary/5" : ""
              } ${panel.isLocked ? "bg-muted/50" : ""}`}
            >
              {panel.judges.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {panel.isLocked ? "Panel locked" : "Drag judges here"}
                </p>
              ) : (
                panel.judges.map((judge) => (
                  <Card key={judge.id} className="p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {judge.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {judge.email}
                        </p>
                      </div>
                      {!panel.isLocked && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveJudge(judge.id, panel.id)}
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Submissions Section */}
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Submissions ({panel.submissions.length}/{panel.capacity})
            </h4>
            {/* eslint-disable-next-line react-compiler/react-compiler */}
            <div
              ref={submissionsDroppable.setNodeRef}
              className={`min-h-37.5 rounded-md border-2 border-dashed p-2 space-y-2 ${
                submissionsDroppable.isOver ? "border-primary bg-primary/5" : ""
              } ${panel.isLocked ? "bg-muted/50" : ""}`}
            >
              {panel.submissions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  {panel.isLocked ? "Panel locked" : "Drag submissions here"}
                </p>
              ) : (
                panel.submissions.map((submission) => (
                  <Card key={submission.id} className="p-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {submission.teamName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {submission.psTitle}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {submission.track}
                          </Badge>
                          {submission.isLocked && (
                            <Badge variant="secondary" className="text-xs">
                              <LockKeyhole className="mr-1 h-2 w-2" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleToggleSubmissionLock(submission.id)
                          }
                          className="h-6 w-6"
                        >
                          {submission.isLocked ? (
                            <LockKeyhole className="h-3 w-3" />
                          ) : (
                            <LockOpen className="h-3 w-3" />
                          )}
                        </Button>
                        {!submission.isLocked && !panel.isLocked && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              onRemoveSubmission(submission.id, panel.id)
                            }
                            className="h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{panel.name}&quot;? This
              will remove {panel.judges.length} judges and{" "}
              {panel.submissions.length} submissions from this panel. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePanel}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
