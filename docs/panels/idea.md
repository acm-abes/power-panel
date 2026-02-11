<!-- @format -->

# Judge–Panel–Submission Allocation System

**Smart ABES Hackathon (SAH)**

---

# 1. Objective

Build a semi-automated system that:

1. Generates balanced + optionally specialized judge panels.
2. Automatically assigns submissions to panels.
3. Ensures:
   - Fair workload distribution
   - Track specialization alignment
   - No panel overload

4. Allows full manual override by admins.
5. Supports safe regeneration before evaluation begins.

This system must be:

- Deterministic
- Explainable
- Re-runnable
- Auditable

---

# 2. Domain Definitions

## 2.1 Tracks

Tracks are fixed:

- AI
- Web3
- Defense

Each submission belongs to exactly one track.

---

## 2.2 Judge

Each judge has:

```ts
id: string;
name: string;
trackPreference: {
  AI: number;
  Web3: number;
  Defense: number;
}
```

Rules:

- Scores range 0–10.
- Higher means stronger preference/competence.

---

## 2.3 Panel

```ts
id: string
name: string
capacity: number
judges: Judge[]
```

Derived properties:

```ts
panelTrackScore: {
  AI: number;
  Web3: number;
  Defense: number;
}
```

Where:

```
panelTrackScore(track) =
    sum(judge.trackPreference[track])
```

---

## 2.4 Submission

```ts
id: string;
track: "AI" | "Web3" | "Defense";
assignedPanelId: string | null;
```

---

# 3. Phase 1 – Panel Generation Engine

## 3.1 Goal

Automatically create panels such that:

- Each panel has N judges (e.g., 3).
- Majority panels are balanced.
- Some panels may emerge as specialized.
- Judges are evenly distributed.

---

## 3.2 Input

- List of judges
- Desired judges per panel (e.g., 3)

---

## 3.3 Output

- List of generated panels
- Judges assigned to panels
- Computed panelTrackScore for each panel

---

## 3.4 Algorithm (Deterministic Version)

1. Sort judges by their dominant track:

```
dominantTrack =
    max(AI, Web3, Defense)
```

2. Split judges into buckets:
   - AI-dominant
   - Web3-dominant
   - Defense-dominant

3. Create:
   - One specialized panel per dominant bucket (if enough judges).
   - Remaining judges distributed evenly to create balanced panels.

4. Ensure:
   - Each panel has exactly `judgesPerPanel`
   - No judge appears in two panels.

5. After panel creation:
   - Compute panelTrackScore.

---

## 3.5 Optional Advanced Version (Clustering)

Instead of manual buckets:

- Treat each judge as a 3D vector.
- Run k-means clustering (k = number of panels).
- Each cluster becomes a panel.

This is optional and can be added later.

---

# 4. Phase 2 – Submission Assignment Engine

## 4.1 Goal

Automatically assign each submission to exactly one panel such that:

- High track compatibility
- Even load distribution
- No panel exceeds capacity

---

## 4.2 Panel Capacity

```
capacity = ceil(totalSubmissions / totalPanels)
```

Or configurable.

Each panel tracks:

```ts
currentLoad: number;
```

---

## 4.3 Compatibility Score

For submission S and panel P:

```
compatibility(S, P) =
    P.panelTrackScore[S.track]
```

---

## 4.4 Load Penalty

To prevent overload:

```
loadRatio = currentLoad / capacity
loadPenalty = loadWeight * loadRatio
```

`loadWeight` is a tunable constant (e.g., 5–10).

---

## 4.5 Final Score Formula

```
finalScore(S, P) =
    compatibility(S, P)
    - loadPenalty
```

---

## 4.6 Assignment Algorithm

For each submission:

1. Filter panels where:

   ```
   currentLoad < capacity
   ```

2. Compute finalScore for all valid panels.

3. Assign submission to panel with highest finalScore.

4. Increment panel currentLoad.

---

## 4.7 Determinism Requirement

To ensure reproducibility:

- Sort submissions by id before assignment.
- Break ties using panel id ordering.

This ensures same input → same output.

---

# 5. Admin Control Layer

Automation must never remove admin control.

---

## 5.1 Manual Panel Editing

Admins must be able to:

- Move judge from Panel A → Panel B
- Swap judges
- Delete panel
- Lock panel (prevent reassignment)

---

## 5.2 Manual Submission Reassignment

Admins must be able to:

- Move submission from Panel A → Panel B
- Lock submission (exclude from auto regeneration)

---

## 5.3 Regeneration Modes

### Full Regeneration

- Rebuild panels
- Reassign all submissions

### Assignment-Only Regeneration

- Keep panels
- Reassign submissions

---

## 5.4 Locking Rules

Each panel and submission can have:

```ts
isLocked: boolean;
```

If locked:

- System must not modify during regeneration.

---

# 6. Evaluation Freeze Rule

Before judging starts:

- System fully dynamic

After judging starts:

- Auto-regeneration disabled
- Only manual changes allowed

---

# 7. Transparency & Logging

For every submission assignment, store:

```ts
{
  (submissionId, panelId, compatibility, loadPenalty, finalScore, timestamp);
}
```

This ensures:

- Auditability
- Fairness explanation
- Transparency

---

# 8. System Separation (Important)

Keep these modules separate:

### PanelEngine

- createPanels()
- computePanelTrackScores()

### AssignmentEngine

- assignSubmissions()
- computeCompatibility()
- computeFinalScore()

### AdminService

- moveJudge()
- moveSubmission()
- lockPanel()
- lockSubmission()

Do NOT mix responsibilities.

---

# 9. Constraints & Guarantees

System must guarantee:

1. Each judge belongs to exactly one panel.
2. Each submission belongs to exactly one panel.
3. No panel exceeds capacity.
4. Deterministic behavior.
5. Admin override always takes priority.

---

# 10. Future Improvements (Optional)

- Replace greedy assignment with min-cost max-flow for global optimality.
- Add track balancing constraint (avoid extreme skew).
- Add UI analytics:
  - Panel specialization graph
  - Load heatmap
  - Track distribution report

---

# 11. Non-Goals

- No bias detection (all judges from industry).
- No conflict-of-interest modeling.
- No multi-panel evaluation per submission.

---
