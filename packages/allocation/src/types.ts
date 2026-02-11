/** @format */

export type Track = "AI" | "Web3" | "Defense";

export interface BoxedTrackScores {
  AI: number;
  Web3: number;
  Defense: number;
}

export interface AllocationJudge {
  id: string;
  name: string;
  trackPreferences: BoxedTrackScores;
}

export interface AllocationSubmission {
  id: string;
  track: Track;
}

export interface GeneratedPanel {
  id: string; // specialized-AI-1, or generic UUID
  judges: AllocationJudge[];
  trackScore: BoxedTrackScores;
  capacity?: number;
  currentLoad?: number;
}

export interface PanelConfig {
  judgesPerPanel: number;
}
