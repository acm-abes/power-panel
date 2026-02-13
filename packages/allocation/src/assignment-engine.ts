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

// Check if panel is specialized (high score in one track) vs mixed
function isSpecializedPanel(panel: GeneratedPanel): boolean {
  const scores = Object.values(panel.trackScore);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Specialized if max score is significantly higher than average
  return maxScore > avgScore * 1.5;
}

export function assignSubmissions(
  submissions: AllocationSubmission[],
  panels: GeneratedPanel[],
  strategy: "better-panel-first" | "equal-distribution" = "better-panel-first",
): Record<string, string> {
  // submissionId -> panelId
  const assignments: Record<string, string> = {};

  // Sort submissions by ID for determinism
  const sortedSubmissions = [...submissions].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  // Initialize currentLoad if undefined
  panels.forEach((p) => {
    if (p.currentLoad === undefined) p.currentLoad = 0;
  });

  if (strategy === "equal-distribution") {
    return assignWithEqualDistribution(sortedSubmissions, panels);
  }

  // Original "better-panel-first" strategy
  for (const submission of sortedSubmissions) {
    let bestPanelId: string | null = null;
    let highestScore = -Infinity;

    // Filter valid panels (capacity check)
    const validPanels = panels.filter(
      (p) => (p.currentLoad || 0) < (p.capacity || Infinity),
    );

    if (validPanels.length === 0) {
      console.warn(
        `No valid panels found for submission ${submission.id} (all at full capacity?)`,
      );
      continue;
    }

    for (const panel of validPanels) {
      const compatibility = calculateCompatibility(submission, panel);
      const loadPenalty = calculateLoadPenalty(panel);
      const finalScore = compatibility - loadPenalty;

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
    }
  }

  return assignments;
}

// Equal distribution strategy: spread submissions evenly across compatible panels
function assignWithEqualDistribution(
  submissions: AllocationSubmission[],
  panels: GeneratedPanel[],
): Record<string, string> {
  const assignments: Record<string, string> = {};

  for (const submission of submissions) {
    // Get compatible panels sorted by compatibility score
    const compatiblePanels = panels
      .filter((p) => (p.currentLoad || 0) < (p.capacity || Infinity))
      .map((p) => ({
        panel: p,
        compatibility: calculateCompatibility(submission, p),
        isSpecialized: isSpecializedPanel(p),
      }))
      .filter((p) => p.compatibility > 0) // Only panels with some compatibility
      .sort((a, b) => {
        // Sort by: 1. Specialized first, 2. Current load (ascending), 3. Compatibility (descending)
        if (a.isSpecialized !== b.isSpecialized) {
          return a.isSpecialized ? -1 : 1;
        }
        const loadDiff =
          (a.panel.currentLoad || 0) - (b.panel.currentLoad || 0);
        if (loadDiff !== 0) return loadDiff;
        return b.compatibility - a.compatibility;
      });

    if (compatiblePanels.length === 0) {
      // No compatible panels with capacity, try any panel with capacity
      const anyPanel = panels.find(
        (p) => (p.currentLoad || 0) < (p.capacity || Infinity),
      );
      if (anyPanel) {
        assignments[submission.id] = anyPanel.id;
        anyPanel.currentLoad = (anyPanel.currentLoad || 0) + 1;
      } else {
        console.warn(
          `No valid panels found for submission ${submission.id} (all at full capacity?)`,
        );
      }
      continue;
    }

    // Assign to the least loaded compatible panel
    const selectedPanel = compatiblePanels[0].panel;
    assignments[submission.id] = selectedPanel.id;
    selectedPanel.currentLoad = (selectedPanel.currentLoad || 0) + 1;
  }

  return assignments;
}
