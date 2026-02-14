/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getSuggestedAssignments,
  assignSubmissionToPanelAction,
} from "@/server/actions/admin-allocation";

type Suggestion = {
  submissionId: string;
  panelId: string;
  teamName: string;
  teamCode: string;
  psTitle: string;
  track: string;
  panelName: string;
  compatibility: string;
};

type SuggestionByPanel = {
  panelId: string;
  panelName: string;
  slotName?: string;
  capacity: number;
  currentLoad: number;
  suggestedCount: number;
  suggestions: Suggestion[];
};

type AssignmentSuggestionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotId?: string;
  onApplySuggestions: () => void;
};

export function AssignmentSuggestionsDialog({
  open,
  onOpenChange,
  slotId,
  onApplySuggestions,
}: AssignmentSuggestionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestionsByPanel, setSuggestionsByPanel] = useState<
    SuggestionByPanel[]
  >([]);
  const [stats, setStats] = useState<{
    totalUnassigned: number;
    suggested: number;
  } | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);

    const result = await getSuggestedAssignments(
      slotId ? { slotId } : undefined,
    );

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSuggestionsByPanel(result.suggestionsByPanel || []);
    setStats(result.stats || null);
  }, [slotId]);

  useEffect(() => {
    if (open) {
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slotId]);

  const handleApplyAll = async () => {
    setApplying(true);

    let successCount = 0;
    let errorCount = 0;

    for (const panel of suggestionsByPanel) {
      for (const suggestion of panel.suggestions) {
        const result = await assignSubmissionToPanelAction({
          submissionId: suggestion.submissionId,
          panelId: suggestion.panelId,
          isLocked: false,
        });

        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
      }
    }

    setApplying(false);

    if (errorCount === 0) {
      toast.success(`All ${successCount} suggestions applied successfully!`);
      onApplySuggestions();
      onOpenChange(false);
    } else {
      toast.warning(
        `Applied ${successCount} suggestions, ${errorCount} failed`,
      );
      fetchSuggestions(); // Refresh to show remaining
    }
  };

  const handleApplyPanel = async (panelId: string) => {
    const panel = suggestionsByPanel.find((p) => p.panelId === panelId);
    if (!panel) return;

    setApplying(true);

    let successCount = 0;
    let errorCount = 0;

    for (const suggestion of panel.suggestions) {
      const result = await assignSubmissionToPanelAction({
        submissionId: suggestion.submissionId,
        panelId: suggestion.panelId,
        isLocked: false,
      });

      if (result.error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    setApplying(false);

    if (errorCount === 0) {
      toast.success(
        `Applied ${successCount} suggestions for ${panel.panelName}`,
      );
      fetchSuggestions(); // Refresh
    } else {
      toast.warning(
        `Applied ${successCount} suggestions, ${errorCount} failed`,
      );
      fetchSuggestions();
    }
  };

  const totalSuggestions = suggestionsByPanel.reduce(
    (sum, p) => sum + p.suggestedCount,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assignment Suggestions</DialogTitle>
          <DialogDescription>
            AI-generated suggestions for assigning submissions to panels based
            on track compatibility and balanced load distribution.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {stats && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {totalSuggestions} suggestions generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalUnassigned} unassigned submissions ·{" "}
                    {stats.suggested} matched to panels
                  </p>
                </div>
                <Button
                  onClick={handleApplyAll}
                  disabled={applying || totalSuggestions === 0}
                >
                  {applying ? (
                    <>
                      <Loader2 className=" h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className=" h-4 w-4" />
                      Apply All
                    </>
                  )}
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {suggestionsByPanel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <p className="mb-2">No suggestions available</p>
                    <p className="text-sm">
                      All submissions are already assigned or no suitable panels
                      found.
                    </p>
                  </div>
                ) : (
                  suggestionsByPanel.map((panel) => (
                    <Card key={panel.panelId} className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{panel.panelName}</h4>
                          {panel.slotName && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {panel.slotName}
                            </Badge>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground">
                            {panel.currentLoad + panel.suggestedCount}/
                            {panel.capacity} after applying
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyPanel(panel.panelId)}
                          disabled={applying || panel.suggestedCount === 0}
                        >
                          Apply {panel.suggestedCount}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {panel.suggestions.map((suggestion) => (
                          <div
                            key={suggestion.submissionId}
                            className="rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {suggestion.teamName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {suggestion.psTitle}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.track}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            {applying ? "Please wait..." : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
