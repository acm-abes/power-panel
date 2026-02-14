/** @format */

"use client";

import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Panel = {
  id: string;
  name: string;
  capacity: number;
  judges: any[];
  submissions: any[];
  slotId: string;
  isLocked: boolean;
};

type ValidationIssue = {
  type: "error" | "warning" | "info";
  message: string;
  panelId?: string;
  panelName?: string;
};

type PanelValidationAlertsProps = {
  panels: Panel[];
  unassignedCount: number;
};

export function PanelValidationAlerts({
  panels,
  unassignedCount,
}: PanelValidationAlertsProps) {
  const issues = useMemo(() => {
    const found: ValidationIssue[] = [];

    // Check for unassigned submissions
    if (unassignedCount > 0) {
      found.push({
        type: "warning",
        message: `${unassignedCount} submission${unassignedCount > 1 ? "s" : ""} not yet assigned to any panel`,
      });
    }

    // Check each panel for issues
    panels.forEach((panel) => {
      // Panel has no judges
      if ((panel.judges?.length || 0) === 0 && !panel.isLocked) {
        found.push({
          type: "warning",
          message: `Panel has no judges assigned`,
          panelId: panel.id,
          panelName: panel.name,
        });
      }

      // Panel has submissions but no judges
      if (
        (panel.judges?.length || 0) === 0 &&
        (panel.submissions?.length || 0) > 0
      ) {
        found.push({
          type: "error",
          message: `Panel has ${panel.submissions?.length || 0} submission${(panel.submissions?.length || 0) > 1 ? "s" : ""} but no judges`,
          panelId: panel.id,
          panelName: panel.name,
        });
      }

      // Panel exceeds capacity
      if ((panel.submissions?.length || 0) > panel.capacity) {
        found.push({
          type: "error",
          message: `Panel exceeds capacity (${panel.submissions?.length || 0}/${panel.capacity})`,
          panelId: panel.id,
          panelName: panel.name,
        });
      }

      // Panel at capacity
      if (
        (panel.submissions?.length || 0) === panel.capacity &&
        !panel.isLocked
      ) {
        found.push({
          type: "info",
          message: `Panel is at full capacity (${panel.capacity}/${panel.capacity})`,
          panelId: panel.id,
          panelName: panel.name,
        });
      }

      // Panel has very few judges
      if (
        (panel.judges?.length || 0) === 1 &&
        (panel.submissions?.length || 0) > 0 &&
        !panel.isLocked
      ) {
        found.push({
          type: "warning",
          message: `Panel has only 1 judge for ${panel.submissions?.length || 0} submission${(panel.submissions?.length || 0) > 1 ? "s" : ""}`,
          panelId: panel.id,
          panelName: panel.name,
        });
      }
    });

    // Check for duplicate judges across panels in same slot
    const judgeSlotMap = new Map<string, Set<string>>();
    panels.forEach((panel) => {
      (panel.judges || []).forEach((judge) => {
        const key = `${judge.id}-${panel.slotId}`;
        if (!judgeSlotMap.has(key)) {
          judgeSlotMap.set(key, new Set());
        }
        judgeSlotMap.get(key)!.add(panel.name);
      });
    });

    judgeSlotMap.forEach((panelNames) => {
      if (panelNames.size > 1) {
        found.push({
          type: "error",
          message: `A judge is assigned to multiple panels in the same slot: ${Array.from(panelNames).join(", ")}`,
        });
      }
    });

    return found;
  }, [panels, unassignedCount]);

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const infos = issues.filter((i) => i.type === "info");

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">
                {errors.length} error{errors.length > 1 ? "s" : ""} found:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                {errors.map((issue, idx) => (
                  <li key={idx} className="text-sm">
                    {issue.panelName && (
                      <Badge variant="outline" className=" text-xs">
                        {issue.panelName}
                      </Badge>
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">
                {warnings.length} warning{warnings.length > 1 ? "s" : ""}:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                {warnings.map((issue, idx) => (
                  <li key={idx} className="text-sm">
                    {issue.panelName && (
                      <Badge variant="outline" className=" text-xs">
                        {issue.panelName}
                      </Badge>
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info messages (collapsed if too many) */}
      {infos.length > 0 && infos.length <= 3 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <ul className="ml-4 list-disc space-y-1">
                {infos.map((issue, idx) => (
                  <li key={idx} className="text-sm">
                    {issue.panelName && (
                      <Badge variant="outline" className=" text-xs">
                        {issue.panelName}
                      </Badge>
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
