/** @format */

"use server";

import { prisma } from "@power/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }

  return session.user;
}

export async function assignJudgeToPanel(judgeId: string, panelId: string) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    // Remove from other panels first? Logic says "Each judge belongs to exactly one panel"
    // So we should delete existing assignments for this judge
    await prisma.panelJudge.deleteMany({
      where: { userId: judgeId },
    });

    await prisma.panelJudge.create({
      data: {
        panelId,
        userId: judgeId,
      },
    });

    revalidatePath("/admin/panels/[id]"); // Assuming dynamic route
    return { success: true };
  } catch (error) {
    console.error("Failed to assign judge:", error);
    return { error: "Failed to assign judge" };
  }
}

export async function removeJudgeFromPanel(judgeId: string, panelId: string) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.panelJudge.deleteMany({
      where: {
        panelId,
        userId: judgeId,
      },
    });
    revalidatePath("/admin/panels/[id]");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove judge:", error);
    return { error: "Failed to remove judge" };
  }
}

export async function assignSubmissionToPanel(
  submissionId: string,
  panelId: string,
) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { panelId },
    });
    revalidatePath("/admin/panels/[id]");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign submission:", error);
    return { error: "Failed to assign submission" };
  }
}

export async function lockPanel(panelId: string, isLocked: boolean) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.panel.update({
      where: { id: panelId },
      data: { isLocked },
    });
    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle lock:", error);
    return { error: "Failed to toggle lock" };
  }
}

import {
  createPanels,
  computePanelTrackScores,
  assignSubmissions,
  AllocationJudge,
  AllocationSubmission,
  GeneratedPanel,
} from "@power/allocation";

// --- Panel Generation ---

export async function previewPanelsAction(config: {
  judgesPerPanel: number;
  strategy: "fresh" | "unallocated";
  capacity: number;
}) {
  try {
    await checkAdmin();

    // Fetch all judges
    const allJudges = await prisma.user.findMany({
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
        trackPreferences: true,
        panelJudges: {
          select: { panelId: true },
        },
      },
    });

    // Filter based on strategy
    let judgesToAllocate = allJudges;
    if (config.strategy === "unallocated") {
      judgesToAllocate = allJudges.filter((j) => j.panelJudges.length === 0);
    }

    // Map to AllocationJudge
    const allocationJudges: AllocationJudge[] = judgesToAllocate.map((j) => ({
      id: j.id,
      name: j.name,
      trackPreferences: (j.trackPreferences as any) || {
        AI: 0,
        Web3: 0,
        Defense: 0,
      },
    }));

    // Run Algorithm
    const generatedPanels = createPanels(allocationJudges, {
      judgesPerPanel: config.judgesPerPanel,
    });

    // Apply capacity to generated panels
    const panelsWithCapacity = generatedPanels.map((p) => ({
      ...p,
      capacity: config.capacity,
    }));

    return { success: true, panels: panelsWithCapacity };
  } catch (error) {
    console.error("Preview panels failed:", error);
    return { error: "Failed to generate preview" };
  }
}

export async function confirmPanelsAction(
  panels: GeneratedPanel[],
  strategy: "fresh" | "unallocated",
) {
  try {
    await checkAdmin();

    // Transactional save
    await prisma.$transaction(async (tx) => {
      // If using "fresh" strategy, delete all existing panels first
      // This ensures no judge is part of multiple panels
      if (strategy === "fresh") {
        // Delete in order: panel judges, then panels
        await tx.panelJudge.deleteMany({});
        await tx.panel.deleteMany({});
      }

      for (const p of panels) {
        // Create Panel
        const createdPanel = await tx.panel.create({
          data: {
            name: p.id, // Auto-generated ID as name initially
            capacity: p.capacity || 5, // Use capacity from generated panel
            // isLocked: false
          },
        });

        // Create PanelJudge relations
        for (const judge of p.judges) {
          await tx.panelJudge.create({
            data: {
              panelId: createdPanel.id,
              userId: judge.id,
            },
          });
        }
      }
    });

    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Confirm panels failed:", error);
    return { error: "Failed to save panels" };
  }
}

// --- Submission Assignment ---

// Helper function to normalize track values from database to TypeScript type
function normalizeTrack(dbTrack: string): "AI" | "Web3" | "Defense" {
  const normalized = dbTrack.toLowerCase();
  switch (normalized) {
    case "ai":
      return "AI";
    case "web3":
      return "Web3";
    case "defence":
    case "defense":
      return "Defense";
    default:
      console.warn(`Unknown track value: ${dbTrack}, defaulting to AI`);
      return "AI";
  }
}

export async function previewAssignmentsAction() {
  try {
    await checkAdmin();

    // Fetch Submissions (only those needing assignment)
    // Only fetch submissions that haven't been assigned to a panel yet
    const submissions = await prisma.submission.findMany({
      where: {
        panelId: null, // Only unassigned submissions
      },
      select: {
        id: true,
        psId: true,
        team: {
          select: {
            id: true,
            name: true,
            teamCode: true,
          },
        },
        problemStatement: {
          select: {
            track: true,
            title: true,
          },
        },
      },
    });

    // Fetch Panels with Judges and Scores
    const dbPanels = await prisma.panel.findMany({
      include: {
        judges: {
          include: {
            user: {
              select: { id: true, name: true, trackPreferences: true },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    // Convert to Allocation types with normalized track values
    const allocSubmissions: AllocationSubmission[] = submissions.map((s) => ({
      id: s.id,
      track: normalizeTrack(s.problemStatement.track),
    }));

    const allocPanels: GeneratedPanel[] = dbPanels.map((p) => {
      const judges: AllocationJudge[] = p.judges.map((pj) => ({
        id: pj.user.id,
        name: pj.user.name,
        trackPreferences: (pj.user.trackPreferences as any) || {
          AI: 0,
          Web3: 0,
          Defense: 0,
        },
      }));

      return {
        id: p.id,
        judges,
        trackScore: computePanelTrackScores(judges),
        capacity: p.capacity,
        currentLoad: p._count.submissions,
      };
    });

    // Run Assignment
    const assignments = assignSubmissions(allocSubmissions, allocPanels); // submissionId -> panelId

    // Build detailed assignment info for UI
    const assignmentDetails = Object.entries(assignments).map(
      ([submissionId, panelId]) => {
        const submission = submissions.find((s) => s.id === submissionId)!;
        const panel = dbPanels.find((p) => p.id === panelId)!;

        return {
          submissionId,
          panelId,
          teamName: submission.team.name,
          teamCode: submission.team.teamCode,
          psTitle: submission.problemStatement.title,
          track: normalizeTrack(submission.problemStatement.track),
          panelName: panel.name,
        };
      },
    );

    // Group assignments by panel for easier display
    const assignmentsByPanel = dbPanels.map((panel) => {
      const panelAssignments = assignmentDetails.filter(
        (a) => a.panelId === panel.id,
      );

      return {
        panelId: panel.id,
        panelName: panel.name,
        capacity: panel.capacity,
        currentLoad: panel._count.submissions,
        newAssignments: panelAssignments.length,
        assignments: panelAssignments,
      };
    });

    return {
      success: true,
      assignments,
      assignmentDetails,
      assignmentsByPanel,
      stats: {
        total: allocSubmissions.length,
        assigned: Object.keys(assignments).length,
      },
    };
  } catch (error) {
    console.error("Preview assignments failed:", error);
    return { error: "Failed to generate assignment preview" };
  }
}

export async function confirmAssignmentsAction(
  assignments: Record<string, string>,
) {
  try {
    await checkAdmin();

    // Bulk update
    // Prisma doesn't support generic bulk update with different values easily without raw query or loop.
    // Loop is safer for now for reasonable size.

    await prisma.$transaction(async (tx) => {
      const promises = Object.entries(assignments).map(
        ([submissionId, panelId]) =>
          tx.submission.update({
            where: { id: submissionId },
            data: { panelId },
          }),
      );
      await Promise.all(promises);
    });

    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Confirm assignments failed:", error);
    return { error: "Failed to apply assignments" };
  }
}
