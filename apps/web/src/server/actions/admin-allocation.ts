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
    // Create a SubmissionAssignment record instead of updating panelId
    await prisma.submissionAssignment.create({
      data: {
        submissionId,
        panelId,
      },
    });
    revalidatePath("/admin/panels/[id]");
    revalidatePath("/admin/panels/assignments");
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
  slotId: string;
}) {
  try {
    await checkAdmin();

    // Fetch all judges with their availability for the selected slot
    const allJudges = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { name: "JUDGE" },
          },
        },
        judgeAvailabilities: {
          some: {
            slotId: config.slotId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        trackPreferences: true,
        panelJudges: {
          select: {
            panelId: true,
            panel: {
              select: {
                slotId: true,
              },
            },
          },
        },
      },
    });

    // Filter based on strategy
    let judgesToAllocate = allJudges;
    if (config.strategy === "unallocated") {
      // For unallocated strategy in slot context, only consider judges not in any panel for this slot
      judgesToAllocate = allJudges.filter(
        (j) =>
          j.panelJudges.filter((pj) => pj.panel.slotId === config.slotId)
            .length === 0,
      );
    }

    // Map to AllocationJudge
    const allocationJudges: AllocationJudge[] = judgesToAllocate.map((j) => ({
      id: j.id,
      name: j.name,
      trackPreferences: (j.trackPreferences as Record<
        "AI" | "Web3" | "Defense",
        number
      >) || {
        AI: 0,
        Web3: 0,
        Defense: 0,
      },
    }));

    // Run Algorithm
    const generatedPanels = createPanels(allocationJudges, {
      judgesPerPanel: config.judgesPerPanel,
    });

    // Apply capacity and slotId to generated panels
    const panelsWithCapacity = generatedPanels.map((p) => ({
      ...p,
      capacity: config.capacity,
      slotId: config.slotId,
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
  slotId: string,
) {
  try {
    await checkAdmin();

    // Transactional save
    await prisma.$transaction(async (tx) => {
      // If using "fresh" strategy, delete all existing panels for THIS SLOT
      // This ensures no judge is part of multiple panels in the same slot
      if (strategy === "fresh") {
        // Get all panels for this slot
        const panelsInSlot = await tx.panel.findMany({
          where: { slotId },
          select: { id: true },
        });

        // Delete panel judges for these panels
        await tx.panelJudge.deleteMany({
          where: {
            panelId: { in: panelsInSlot.map((p) => p.id) },
          },
        });

        // Delete panels for this slot
        await tx.panel.deleteMany({
          where: { slotId },
        });
      }

      for (const p of panels) {
        // Create Panel
        const createdPanel = await tx.panel.create({
          data: {
            name: p.id, // Auto-generated ID as name initially
            capacity: p.capacity || 5, // Use capacity from generated panel
            slotId: slotId,
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
    revalidatePath("/admin/panels/slots");
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

export async function previewAssignmentsAction(
  strategy: "better-panel-first" | "equal-distribution" = "better-panel-first",
  slotFilter?: string,
) {
  try {
    await checkAdmin();

    // Fetch Submissions (only those needing assignment)
    // Only fetch submissions that haven't been assigned to a panel yet
    const submissions = await prisma.submission.findMany({
      where: {
        assignments: {
          none: {},
        },
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
      where: slotFilter
        ? {
            slotId: slotFilter,
          }
        : undefined,
      include: {
        judges: {
          include: {
            user: {
              select: { id: true, name: true, trackPreferences: true },
            },
          },
        },
        slot: {
          select: {
            id: true,
            name: true,
            day: true,
            startTime: true,
            endTime: true,
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
        trackPreferences: (pj.user.trackPreferences as Record<
          "AI" | "Web3" | "Defense",
          number
        >) || {
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
        slotId: p.slotId || undefined,
      };
    });

    // Run Assignment with selected strategy
    const assignments = assignSubmissions(
      allocSubmissions,
      allocPanels,
      strategy,
    );

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
          slotName: panel.slot?.name,
          slotId: panel.slotId,
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
        slotName: panel.slot?.name,
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
      strategy,
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

    // Use a transaction to create all judge assignments atomically
    await prisma.$transaction(async (tx) => {
      for (const [submissionId, panelId] of Object.entries(assignments)) {
        // Get the submission to find the teamId
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          select: { teamId: true },
        });

        if (!submission) {
          console.error(`Submission ${submissionId} not found`);
          continue;
        }

        // Create SubmissionAssignment record
        await tx.submissionAssignment.create({
          data: {
            submissionId,
            panelId,
          },
        });

        // Get all judges in this panel
        const panelJudges = await tx.panelJudge.findMany({
          where: { panelId },
          select: { userId: true },
        });

        // Create JudgeAssignment for each judge in the panel
        for (const panelJudge of panelJudges) {
          await tx.judgeAssignment.upsert({
            where: {
              judgeId_teamId: {
                judgeId: panelJudge.userId,
                teamId: submission.teamId,
              },
            },
            create: {
              judgeId: panelJudge.userId,
              teamId: submission.teamId,
            },
            update: {}, // If already exists, do nothing
          });
        }
      }
    });

    revalidatePath("/admin/panels");
    revalidatePath("/admin/panels/assignments");
    return { success: true };
  } catch (error) {
    console.error("Confirm assignments failed:", error);
    return { error: "Failed to apply assignments" };
  }
}
