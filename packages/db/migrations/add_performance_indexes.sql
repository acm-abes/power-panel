-- Performance optimization indexes for team page queries

-- Add index for filtering evaluations by submittedAt
CREATE INDEX IF NOT EXISTS "evaluation_submittedAt_idx" ON "evaluation"("submittedAt");

-- Add composite index for team evaluations filtering (team + submitted)
CREATE INDEX IF NOT EXISTS "evaluation_teamId_submittedAt_idx" ON "evaluation"("teamId", "submittedAt");

-- Add index for ordering mentor feedbacks by date
CREATE INDEX IF NOT EXISTS "mentor_feedback_createdAt_idx" ON "mentor_feedback"("createdAt");

-- Add composite index for team feedback queries (team + date ordering)
CREATE INDEX IF NOT EXISTS "mentor_feedback_teamId_createdAt_idx" ON "mentor_feedback"("teamId", "createdAt");

-- Add index for problem statement lookups by track
-- (This might already exist, but adding it for completeness)
CREATE INDEX IF NOT EXISTS "problem_statement_track_idx" ON "problem_statement"("track");
