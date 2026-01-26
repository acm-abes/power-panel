<!-- @format -->

1️⃣ Core principles (so the schema doesn’t rot)

Before tables, 4 rules:

Email = global identity

One user can have multiple roles (participant + mentor is possible IRL)

One evaluation = one judge × one team

Excel seeding only touches Users + Teams + Memberships

Everything else builds on this.

2️⃣ Core tables (non-negotiable)
🧑 User

Represents any human in the system.

## User

id (PK)
email (unique)
name (nullable)
createdAt
updatedAt

Notes:

Email is unique → Excel-safe

Name optional → don’t trust Excel names

No role field here (very intentional)

👥 Team

Hackathon team.

## Team

id (PK)
name
track (nullable)
createdAt
updatedAt

Notes:

Track optional (some teams may not have one initially)

No leader column here (we handle that properly below)

🔗 TeamMember

This is the junction table that saves your sanity.

## TeamMember

id (PK)
userId (FK → User)
teamId (FK → Team)
role ("LEAD" | "MEMBER")
createdAt

Rules:

(userId, teamId) should be unique

Leader is just a role, not a special snowflake

This table is where Excel seeding mostly happens.

3️⃣ Roles & permissions (don’t hardcode)
🎭 Role

System-wide roles.

## Role

id (PK)
name ("ADMIN" | "JUDGE" | "MENTOR" | "PARTICIPANT")

🔐 UserRole

Because humans are complicated.

## UserRole

id (PK)
userId (FK → User)
roleId (FK → Role)

Rules:

A judge can also be a mentor

An admin can also be a judge

This avoids future rewrites

4️⃣ Evaluation system (the heart)
🧑‍⚖️ JudgeAssignment

Which judge evaluates which team.

## JudgeAssignment

id (PK)
judgeId (FK → User)
teamId (FK → Team)

Rules:

Unique (judgeId, teamId)

Created by admins only

Can be pre-generated before evaluation day

📝 Evaluation

One evaluation submission.

## Evaluation

id (PK)
judgeId (FK → User)
teamId (FK → Team)
submittedAt (nullable)
extraPoints (default 0)
extraJustification (nullable)

Rules:

One evaluation per judge per team

submittedAt != null → evaluation locked

Extra points require justification (enforced in app layer)

📊 EvaluationScore

Individual parameter scores.

## EvaluationScore

id (PK)
evaluationId (FK → Evaluation)
parameter ("PROBLEM" | "TECHNICAL" | "INNOVATION" | "IMPLEMENTATION")
score

Rules:

Unique (evaluationId, parameter)

Keeps schema flexible if parameters change next year

5️⃣ Optional but HIGHLY recommended tables
📢 Announcement
Announcement

---

id (PK)
title
content
createdBy (FK → User)
createdAt

🧑‍🏫 MentorFeedback
MentorFeedback

---

id (PK)
mentorId (FK → User)
teamId (FK → Team)
content
createdAt

Private by default. Never shown to judges.

📦 SeedMeta (small, but elite)
SeedMeta

---

id (PK)
sourceFile
seededAt
seededBy

You’ll thank me when someone asks
“which Excel did we use??”

6️⃣ Prisma-friendly mapping tips (Copilot fuel ⛽)

When converting this to Prisma:

Enums first
enum TeamMemberRole {
LEAD
MEMBER
}

enum EvaluationParameter {
PROBLEM
TECHNICAL
INNOVATION
IMPLEMENTATION
}

Patterns Copilot loves

@relation(fields: [userId], references: [id])

@@unique([userId, teamId])

@@unique([evaluationId, parameter])

Naming advice

Use singular model names

Use camelCase fields

Don’t abbreviate (judgeId, not jid)

Copilot becomes shockingly competent if you follow this.
