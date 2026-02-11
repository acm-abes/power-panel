/** @format */

import { AllocationSubmission, GeneratedPanel, Track } from "./types";

// Constants
const LOAD_WEIGHT = 5;

// Compatibility: Score 0-10 based on panel's track score for the submission's track
// Panel track score is sum of judge scores. 3 judges * 10 = max 30.
export function calculateCompatibility(
  submission: AllocationSubmission,
  panel: GeneratedPanel,
): number {
  return panel.trackScore[submission.track];
}

// Load Penalty: prevents overloading
export function calculateLoadPenalty(panel: GeneratedPanel): number {
  if (!panel.capacity || panel.capacity === 0) return 0;
  const currentLoad = panel.currentLoad || 0;
  const loadRatio = currentLoad / panel.capacity;
  return LOAD_WEIGHT * loadRatio;
}

export function assignSubmissions(
  submissions: AllocationSubmission[],
  panels: GeneratedPanel[],
): Record<string, string> {
  // submissionId -> panelId
  const assignments: Record<string, string> = {};

  console.log(
    "🚀 DEBUG assignSubmissions: Starting with",
    submissions.length,
    "submissions and",
    panels.length,
    "panels",
  );

  // Sort submissions by ID for determinism
  const sortedSubmissions = [...submissions].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  // Initialize currentLoad if undefined
  panels.forEach((p) => {
    if (p.currentLoad === undefined) p.currentLoad = 0;
  });

  console.log(
    "🚀 DEBUG: Panel states:",
    panels.map((p) => ({
      id: p.id,
      capacity: p.capacity,
      currentLoad: p.currentLoad,
      trackScore: p.trackScore,
    })),
  );

  for (const submission of sortedSubmissions) {
    let bestPanelId: string | null = null;
    let highestScore = -Infinity;

    // Filter valid panels (capacity check)
    const validPanels = panels.filter(
      (p) => (p.currentLoad || 0) < (p.capacity || Infinity),
    );

    console.log(
      `🚀 DEBUG: For submission ${submission.id} (track: ${submission.track}), valid panels: ${validPanels.length}`,
    );

    if (validPanels.length === 0) {
      console.warn(
        `No valid panels found for submission ${submission.id} (all at full capacity?)`,
      );
      continue; // Or assign to least loaded? Requirement says "No panel exceeds capacity"
    }

    for (const panel of validPanels) {
      const compatibility = calculateCompatibility(submission, panel);
      const loadPenalty = calculateLoadPenalty(panel);
      const finalScore = compatibility - loadPenalty;

      console.log(
        `  Panel ${panel.id}: compatibility=${compatibility}, loadPenalty=${loadPenalty}, finalScore=${finalScore}`,
      );

      // Break ties deterministically
      if (finalScore > highestScore) {
        highestScore = finalScore;
        bestPanelId = panel.id;
      } else if (finalScore === highestScore) {
        // Tie-breaker: panel ID
        if (bestPanelId === null || panel.id.localeCompare(bestPanelId) < 0) {
          bestPanelId = panel.id;
        }
      }
    }

    if (bestPanelId) {
      assignments[submission.id] = bestPanelId;
      const panel = panels.find((p) => p.id === bestPanelId)!;
      panel.currentLoad = (panel.currentLoad || 0) + 1;
      console.log(
        `✅ Assigned submission ${submission.id} to panel ${bestPanelId}`,
      );
    }
  }

  console.log(
    "🚀 DEBUG: Total assignments made:",
    Object.keys(assignments).length,
  );

  return assignments;
}
