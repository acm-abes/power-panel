<!-- @format -->

# Plan: Slot-Based Panel & Assignment System

You're transitioning from a simple panel system to a **time-slot-aware evaluation system** where judges have availability per slot, panels operate within specific time slots, and submissions are assigned to panel-slot combinations. This involves major database schema changes, new admin UI for slot/availability management, and updates to allocation algorithms.

**Key Decisions from Discussion:**

- **Judges have per-slot availability** (flexible schedules across days/times)
- **Panels are slot-specific** (created for judges available in that slot)
- **One submission per slot** (teams present once)
- **Fresh start** (no data migration needed)
- **Strategies remain UI-configurable** (via radio buttons as currently implemented)

**Steps**

### 1. Database Schema Changes

**Add new models** to [schema.prisma](packages/db/prisma/schema.prisma):

- `EvaluationSlot` model with fields: `id`, `name`, `day`, `startTime`, `endTime`, `slotOrder`, `createdAt`
- `JudgeAvailability` model linking `User` to `EvaluationSlot` with unique constraint on `[judgeId, slotId]`
- `SubmissionAssignment` model replacing direct panel FK with fields: `submissionId`, `panelId`, `assignmentOrder`, timestamps

**Modify existing models**:

- Add `slotId` foreign key to `Panel` model (each panel operates in one slot)
- Remove `panelId` and `panel` relation from `Submission` model
- Add `assignments SubmissionAssignment[]` relation to `Submission`
- Replace `submissions Submission[]` with `submissions SubmissionAssignment[]` on `Panel`
- Add `panelJudges PanelJudge[]` relation to `User` (already exists)
- Add `judgeAvailabilities JudgeAvailability[]` relation to `User`

**Add indexes**: `[slotId]` on `Panel`, `[judgeId]` and `[slotId]` on `JudgeAvailability`, `[panelId]` and `[submissionId]` on `SubmissionAssignment`

### 2. Create Database Migration

Generate Prisma migration reverting old schema and creating new one. Since fresh start is acceptable, the migration can simply drop old `submission.panelId` column and create new tables.

### 3. Admin UI - Slot Management

**Create new page** [apps/web/src/app/admin/panels/slots/page.tsx](apps/web/src/app/admin/panels/slots/page.tsx):

- Display table of evaluation slots with day, time range, order columns
- "Create Slot" button opening dialog
- Edit/Delete actions per slot
- Show count of panels created for each slot

**Create slot CRUD components**:

- [apps/web/src/components/admin/slot-manager.tsx](apps/web/src/components/admin/slot-manager.tsx) - Main slot list display
- [apps/web/src/components/admin/slot-form-dialog.tsx](apps/web/src/components/admin/slot-form-dialog.tsx) - Form with name input, day selector, time pickers for start/end, order input

**Create server actions** in [apps/web/src/server/actions/admin-slots.ts](apps/web/src/server/actions/admin-slots.ts):

- `createSlotAction()`, `updateSlotAction()`, `deleteSlotAction()`, `getSlotsAction()`

### 4. Admin UI - Judge Availability Management

**Create new page** [apps/web/src/app/admin/judges/availability/page.tsx](apps/web/src/app/admin/judges/availability/page.tsx):

- Matrix view: Rows = Judges, Columns = Evaluation Slots
- Checkboxes to toggle availability
- Bulk actions: "Mark all available for slot X", "Clear judge Y availability"
- Visual indicators for judges with no availability

**Create availability component** [apps/web/src/components/admin/judge-availability-matrix.tsx](apps/web/src/components/admin/judge-availability-matrix.tsx):

- Interactive grid with optimistic UI updates
- Color coding: green = available, gray = unavailable
- Summary stats per judge and per slot

**Create server actions** in [apps/web/src/server/actions/admin-availability.ts](apps/web/src/server/actions/admin-availability.ts):

- `toggleJudgeAvailabilityAction(judgeId, slotId, isAvailable)`
- `bulkSetAvailabilityAction(judgeIds, slotId, isAvailable)`
- `getAvailabilityMatrixAction()`

### 5. Update Panel Generation Algorithm

**Modify** [packages/allocation/src/panel-engine.ts](packages/allocation/src/panel-engine.ts):

- Add `slotId` parameter to `createPanels()` function signature
- Filter `judges` input to only include those available in specified slot (checked externally)
- Keep existing specialized panel logic (AI/Web3/Defense grouping)

**Update types** in [packages/allocation/src/types.ts](packages/allocation/src/types.ts):

- Add `slotId?: string` to `GeneratedPanel` interface

### 6. Update Panel Generation UI

**Modify** [apps/web/src/components/admin/panel-generation-dialog.tsx](apps/web/src/components/admin/panel-generation-dialog.tsx):

- Add **Slot Selection** dropdown ABOVE strategy radio buttons (required field)
- Fetch and display available slots from database
- Show "X judges available in this slot" indicator when slot selected
- Keep existing two-step preview/confirm workflow
- Update preview to show slot name in panel cards

**Update server action** `previewPanelsAction()` in [admin-allocation.ts](apps/web/src/server/actions/admin-allocation.ts):

- Accept `slotId` parameter
- Filter judges by `judgeAvailabilities` matching selected slot
- Pass filtered judges to `createPanels()`
- Return panel previews WITH `slotId` included

**Update server action** `confirmPanelsAction()`:

- Accept `slotId` parameter
- Save `Panel` records WITH `slotId` field populated
- Handle "fresh" strategy: delete panels for SELECTED SLOT only (not all panels)
- Create `PanelJudge` relations as before

### 7. Update Submission Assignment Algorithm

**Modify** [packages/allocation/src/assignment-engine.ts](packages/allocation/src/assignment-engine.ts):

- No algorithm changes needed - still assigns `submissionId -> panelId`
- Keep existing strategies: "better-panel-first" and "equal-distribution"
- `currentLoad` logic remains unchanged (counts via `SubmissionAssignment` table)

### 8. Update Submission Assignment UI

**Modify** [apps/web/src/components/admin/assignment-config-dialog.tsx](apps/web/src/components/admin/assignment-config-dialog.tsx):

- Add optional **Slot Filter** dropdown ABOVE strategy selection
  - "All Slots" (default) - assign across all panels
  - Individual slot selection - assign only to panels in that slot
- Keep existing strategy radio buttons
- Update preview to show slot column in assignment table

**Modify** [apps/web/src/components/admin/team-assignment-manager.tsx](apps/web/src/components/admin/team-assignment-manager.tsx):

- Display slot name/time for each panel in the assignment preview
- Group assignments by slot in summary view

**Update server action** `previewAssignmentsAction()`:

- Accept optional `slotFilter` parameter
- If specified, fetch only panels matching `slotId`
- Return assignment details WITH slot info for display
- Keep existing strategy logic

**Update server action** `confirmAssignmentsAction()`:

- Replace `submission.update({ panelId })` with `submissionAssignment.create({ submissionId, panelId })`
- Keep existing `JudgeAssignment` creation logic (judges → teams)
- Use transaction to ensure atomicity

### 9. Update Existing Panel Pages

**Modify** [apps/web/src/app/admin/panels/page.tsx](apps/web/src/app/admin/panels/page.tsx):

- Group panels by slot in accordion view
- Show slot info (day, time range) in section headers
- Add navigation link to "Manage Slots" and "Judge Availability"

**Modify** [apps/web/src/server/actions/admin-allocation.ts](apps/web/src/server/actions/admin-allocation.ts):

- Update `assignSubmissionToPanel()` to create `SubmissionAssignment` instead of updating `submission.panelId`
- Update helper functions to query via `SubmissionAssignment` table

### 10. Update Queries Throughout Codebase

**Search and replace** all queries using `submission.panelId`:

- Replace `where: { panelId: X }` with `where: { assignments: { some: { panelId: X } } }`
- Replace `include: { panel: true }` with `include: { assignments: { include: { panel: true } } }`
- Update count queries: `_count: { select: { submissions: true } }` on `Panel` still works (relation name updated)

**Affected files** (search via grep):

- [apps/web/src/app/admin/panels/assignments/page.tsx](apps/web/src/app/admin/panels/assignments/page.tsx) - update `unassignedCount` query
- [scripts/debug-assignments.ts](scripts/debug-assignments.ts) - update debugging queries
- [previewAssignmentsAction()](apps/web/src/server/actions/admin-allocation.ts) - already noted above

### 11. Navigation Updates

**Modify** [apps/web/src/components/nav-links.tsx](apps/web/src/components/nav-links.tsx):

- Add nested navigation under "Panels": "Overview", "Slots", "Assignments", "Availability"
- Or add "Judge Availability" as separate top-level nav item

---

**Verification**

**Manual Testing Flow:**

1. Navigate to `/admin/panels/slots` → Create 4 slots (Day 1 AM/PM, Day 2 AM/PM)
2. Navigate to `/admin/judges/availability` → Mark various judges available in different slots
3. Navigate to `/admin/panels` → Generate panels for Day 1 AM slot → Preview shows only judges available in that slot → Confirm
4. Repeat step 3 for other slots
5. Navigate to `/admin/panels/assignments` → Select "All Slots" → Choose strategy → Preview shows submissions distributed across all panels → Confirm
6. Verify database: `SubmissionAssignment` records created, `JudgeAssignment` records created, no `submission.panelId` values

**Database Verification:**

```sql
-- Check slots created
SELECT * FROM evaluation_slot ORDER BY slot_order;

-- Check judge availability
SELECT slot.name, COUNT(ja.id) as judge_count
FROM evaluation_slot slot
LEFT JOIN judge_availability ja ON ja.slot_id = slot.id
GROUP BY slot.id;

-- Check panels per slot
SELECT slot.name, COUNT(p.id) as panel_count
FROM evaluation_slot slot
LEFT JOIN panel p ON p.slot_id = slot.id
GROUP BY slot.id;

-- Check assignments
SELECT COUNT(*) as total_assignments FROM submission_assignment;

-- Verify no orphaned panelId on submissions
SELECT COUNT(*) FROM submission WHERE panel_id IS NOT NULL;  -- Should be 0 after migration
```

**Decisions**

- **Chose slot-specific panels** over flexible panel-slot matrix to simplify data model and algorithm
- **Kept existing preview/confirm UI pattern** to maintain consistency with current UX
- **Made slot filter optional** in assignment UI to allow both global and slot-targeted assignment workflows
- **Retained strategy configurability** via radio buttons per existing implementation
