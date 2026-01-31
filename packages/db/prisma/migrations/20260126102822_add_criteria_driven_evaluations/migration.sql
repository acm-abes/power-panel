-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('LEAD', 'MEMBER');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'JUDGE', 'MENTOR', 'PARTICIPANT');

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_assignment" (
    "id" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judge_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criterion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fullMark" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation" (
    "id" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "extraPoints" INTEGER NOT NULL DEFAULT 0,
    "extraJustification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_score" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "evaluation_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_feedback" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_meta" (
    "id" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "seededAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seededBy" TEXT NOT NULL,

    CONSTRAINT "seed_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_member_userId_idx" ON "team_member"("userId");

-- CreateIndex
CREATE INDEX "team_member_teamId_idx" ON "team_member"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_userId_teamId_key" ON "team_member"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "user_role_userId_idx" ON "user_role"("userId");

-- CreateIndex
CREATE INDEX "user_role_roleId_idx" ON "user_role"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_userId_roleId_key" ON "user_role"("userId", "roleId");

-- CreateIndex
CREATE INDEX "judge_assignment_judgeId_idx" ON "judge_assignment"("judgeId");

-- CreateIndex
CREATE INDEX "judge_assignment_teamId_idx" ON "judge_assignment"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "judge_assignment_judgeId_teamId_key" ON "judge_assignment"("judgeId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_criterion_key_key" ON "evaluation_criterion"("key");

-- CreateIndex
CREATE INDEX "evaluation_judgeId_idx" ON "evaluation"("judgeId");

-- CreateIndex
CREATE INDEX "evaluation_teamId_idx" ON "evaluation"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_judgeId_teamId_key" ON "evaluation"("judgeId", "teamId");

-- CreateIndex
CREATE INDEX "evaluation_score_evaluationId_idx" ON "evaluation_score"("evaluationId");

-- CreateIndex
CREATE INDEX "evaluation_score_criterionId_idx" ON "evaluation_score"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_score_evaluationId_criterionId_key" ON "evaluation_score"("evaluationId", "criterionId");

-- CreateIndex
CREATE INDEX "announcement_createdBy_idx" ON "announcement"("createdBy");

-- CreateIndex
CREATE INDEX "mentor_feedback_mentorId_idx" ON "mentor_feedback"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_feedback_teamId_idx" ON "mentor_feedback"("teamId");

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_assignment" ADD CONSTRAINT "judge_assignment_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_assignment" ADD CONSTRAINT "judge_assignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_score" ADD CONSTRAINT "evaluation_score_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_score" ADD CONSTRAINT "evaluation_score_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "evaluation_criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_feedback" ADD CONSTRAINT "mentor_feedback_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_feedback" ADD CONSTRAINT "mentor_feedback_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
