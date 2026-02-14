/** @format */

import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@power/db";
import { Page, PageContent, PageHeading } from "@/components/page";
import { PanelBoard } from "@/components/admin/panel-board";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
    redirect("/");
  }
}

function normalizeTrack(track: string) {
  const upper = track.toUpperCase();
  if (upper.includes("AI") || upper.includes("ML")) return "AI";
  if (upper.includes("WEB3") || upper.includes("BLOCK")) return "Web3";
  if (upper.includes("DEFENSE") || upper.includes("CYBER")) return "Defense";
  return "AI";
}

function computeTrackScores(judges: any[]) {
  const scores = { AI: 0, Web3: 0, Defense: 0 };
  judges.forEach((j) => {
    const prefs = (j.user.trackPreferences as any) || {
      AI: 0,
      Web3: 0,
      Defense: 0,
    };
    scores.AI += prefs.AI || 0;
    scores.Web3 += prefs.Web3 || 0;
    scores.Defense += prefs.Defense || 0;
  });
  return scores;
}

export default async function AdminPanelsPage() {
  await checkAdmin();

  // Fetch slots
  const slots = await prisma.evaluationSlot.findMany({
    orderBy: { slotOrder: "asc" },
    select: { id: true, name: true },
  });

  // Fetch panels with all related data
  const dbPanels = await prisma.panel.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      judges: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              trackPreferences: true,
            },
          },
        },
      },
      submissions: {
        include: {
          submission: {
            include: {
              team: {
                select: { id: true, name: true, teamCode: true },
              },
              problemStatement: {
                select: { title: true, track: true },
              },
            },
          },
        },
      },
      slot: {
        select: { id: true, name: true },
      },
    },
  });

  // Fetch all judges with their panel assignments
  const dbJudges = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: { name: "JUDGE" },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      trackPreferences: true,
      panelJudges: {
        include: {
          panel: {
            select: { id: true, name: true, slotId: true },
          },
        },
      },
      judgeAvailabilities: {
        include: {
          slot: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  // Fetch unassigned submissions (not locked and not assigned to any panel)
  const dbUnassignedSubmissions = await prisma.submission.findMany({
    where: {
      assignments: {
        none: {},
      },
      isLocked: false, // Only show unlocked submissions
    },
    include: {
      team: {
        select: { id: true, name: true, teamCode: true },
      },
      problemStatement: {
        select: { title: true, track: true },
      },
    },
  });

  // Transform panels for the board
  const panels = dbPanels.map((panel) => {
    const judges = panel.judges.map((pj) => ({
      id: pj.user.id,
      name: pj.user.name,
      email: pj.user.email,
      trackPreferences: (pj.user.trackPreferences as any) || {
        AI: 0,
        Web3: 0,
        Defense: 0,
      },
      availableSlotIds: [], // Already assigned judges don't need availability filtering
    }));

    const submissions = panel.submissions.map((sa) => ({
      id: sa.submission.id,
      teamId: sa.submission.teamId,
      teamName: sa.submission.team.name,
      teamCode: sa.submission.team.teamCode,
      psTitle: sa.submission.problemStatement.title,
      track: normalizeTrack(sa.submission.problemStatement.track),
      isLocked: sa.isLocked,
    }));

    return {
      id: panel.id,
      name: panel.name,
      slotId: panel.slotId || "",
      slotName: panel.slot?.name || "No Slot",
      capacity: panel.capacity,
      isLocked: panel.isLocked,
      isManual: panel.isManual,
      notes: panel.notes || undefined,
      judges,
      submissions,
      trackScores: computeTrackScores(panel.judges),
    };
  });

  // Transform judges for the board
  const judges = dbJudges.map((judge) => {
    const inPanel = judge.panelJudges[0];
    const availableSlotIds = judge.judgeAvailabilities.map((ja) => ja.slot.id);

    return {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      trackPreferences: (judge.trackPreferences as any) || {
        AI: 0,
        Web3: 0,
        Defense: 0,
      },
      inPanelId: inPanel?.panel.id,
      inPanelName: inPanel?.panel.name,
      inPanelSlotId: inPanel?.panel.slotId ?? undefined,
      availableSlotIds, // Add available slot IDs
    };
  });

  // Transform unassigned submissions
  const submissions = dbUnassignedSubmissions.map((sub) => ({
    id: sub.id,
    teamId: sub.teamId,
    teamName: sub.team.name,
    teamCode: sub.team.teamCode,
    psTitle: sub.problemStatement.title,
    track: normalizeTrack(sub.problemStatement.track),
    isLocked: false,
  }));

  return (
    <Page>
      <PageHeading title="Panel Management" />

      <PageContent className="">
        <PanelBoard
          initialSlots={slots}
          initialPanels={panels}
          initialJudges={judges}
          initialSubmissions={submissions}
        />
      </PageContent>
    </Page>
  );
}
