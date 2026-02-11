/** @format */

import {
  AllocationJudge,
  BoxedTrackScores,
  GeneratedPanel,
  PanelConfig,
  Track,
} from "./types";

function getDominantTrack(preferences: BoxedTrackScores): Track {
  const { AI, Web3, Defense } = preferences;
  if (AI >= Web3 && AI >= Defense) return "AI";
  if (Web3 >= AI && Web3 >= Defense) return "Web3";
  return "Defense";
}

export function sortJudgesByDominance(
  judges: AllocationJudge[],
): Record<Track, AllocationJudge[]> {
  const buckets: Record<Track, AllocationJudge[]> = {
    AI: [],
    Web3: [],
    Defense: [],
  };

  for (const judge of judges) {
    const dominant = getDominantTrack(judge.trackPreferences);
    buckets[dominant].push(judge);
  }

  // Sort within buckets by score strength desc
  for (const track of Object.keys(buckets) as Track[]) {
    buckets[track].sort(
      (a, b) => b.trackPreferences[track] - a.trackPreferences[track],
    );
  }

  return buckets;
}

export function computePanelTrackScores(
  judges: AllocationJudge[],
): BoxedTrackScores {
  const score: BoxedTrackScores = { AI: 0, Web3: 0, Defense: 0 };
  for (const judge of judges) {
    score.AI += judge.trackPreferences.AI;
    score.Web3 += judge.trackPreferences.Web3;
    score.Defense += judge.trackPreferences.Defense;
  }
  return score;
}

export function createPanels(
  judges: AllocationJudge[],
  config: PanelConfig,
): GeneratedPanel[] {
  const { judgesPerPanel } = config;
  const panels: GeneratedPanel[] = [];

  // 1. Bucket judges
  const buckets = sortJudgesByDominance(judges);

  // 2. Form specialized panels from buckets if possible
  // Heuristic: Try to form pure panels first

  // Flatten remaining judges after forming pure panels (or just round robin if simple approach)
  // For V1, "Semi-Automated" -> Simple specialized buckets then round robin remainder

  let remainingJudges: AllocationJudge[] = [];

  (["AI", "Web3", "Defense"] as Track[]).forEach((track) => {
    let trackJudges = buckets[track];
    while (trackJudges.length >= judgesPerPanel) {
      // Create a specialized panel
      const panelJudges = trackJudges.splice(0, judgesPerPanel);
      panels.push({
        id: `Auto-${track}-${panels.length + 1}`,
        judges: panelJudges,
        trackScore: computePanelTrackScores(panelJudges),
      });
    }
    remainingJudges.push(...trackJudges);
  });

  // 3. Handle remaining judges (Mixed Panels)
  // Sort remaining by total competence? Or just fill?
  // Let's just fill for now.

  while (remainingJudges.length >= judgesPerPanel) {
    const panelJudges = remainingJudges.splice(0, judgesPerPanel);
    panels.push({
      id: `Auto-Mixed-${panels.length + 1}`,
      judges: panelJudges,
      trackScore: computePanelTrackScores(panelJudges),
    });
  }

  // 4. If there are stragglers (< judgesPerPanel), we might need to distribute them or flag them.
  // Requirement: "Each judge belongs to exactly one panel"?
  // If count is not divisible, some panels might have +1 or one panel has less.
  // Idea: Distribute stragglers to existing mixed panels to make them size+1

  let panelIndex = 0;
  while (remainingJudges.length > 0 && panels.length > 0) {
    const judge = remainingJudges.pop()!;
    // Add to a panel (prefer mixed panels first? or just round robin)
    // Actually, let's just add to last formed panels
    const targetPanel = panels[panelIndex % panels.length];
    targetPanel.judges.push(judge);
    targetPanel.trackScore = computePanelTrackScores(targetPanel.judges);
    panelIndex++;
  }

  // If NO panels formed (e.g. < judgesPerPanel total), make one small panel
  if (panels.length === 0 && remainingJudges.length > 0) {
    panels.push({
      id: `Auto-Mixed-1`,
      judges: remainingJudges, // all of them
      trackScore: computePanelTrackScores(remainingJudges),
    });
    remainingJudges = [];
  }

  return panels;
}
