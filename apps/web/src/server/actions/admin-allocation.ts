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

/**
 * @deprecated This function is deprecated and should not be used.
 * It deletes ALL panel assignments for a judge across ALL slots, breaking slot-based isolation.
 * Use `assignJudgeToPanelAction` instead, which properly handles slot-based validation.
 *
 * Bug: This function removes judges from panels in ALL slots when assigning to a new panel,
 * preventing judges from being assigned to multiple panels across different time slots.
 */
export async function assignJudgeToPanel(judgeId: string, panelId: string) {
  console.warn(
    "DEPRECATED: assignJudgeToPanel is deprecated. Use assignJudgeToPanelAction instead.",
  );
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    // BUG: This deletes ALL panel assignments across ALL slots!
    // This prevents judges from being in multiple panels across different time slots.
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
      // If using "fresh" strategy, delete all existing UNLOCKED panels for THIS SLOT
      // This ensures no judge is part of multiple panels in the same slot
      // BUT respects manually created/locked panels
      if (strategy === "fresh") {
        // Get all UNLOCKED panels for this slot
        const panelsInSlot = await tx.panel.findMany({
          where: {
            slotId,
            isLocked: false, // Only delete unlocked panels
          },
          select: { id: true },
        });

        // Delete panel judges for these panels
        await tx.panelJudge.deleteMany({
          where: {
            panelId: { in: panelsInSlot.map((p) => p.id) },
          },
        });

        // Delete unlocked panels for this slot
        await tx.panel.deleteMany({
          where: {
            slotId,
            isLocked: false, // Only delete unlocked panels
          },
        });
      }

      for (const p of panels) {
        // Create Panel (auto-generated panels are not manual and not locked by default)
        const createdPanel = await tx.panel.create({
          data: {
            name: p.id, // Auto-generated ID as name initially
            capacity: p.capacity || 5, // Use capacity from generated panel
            slotId: slotId,
            isManual: false, // Auto-generated
            isLocked: false,
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
        // Check if submission already has a locked assignment (skip if locked)
        const existingAssignment = await tx.submissionAssignment.findFirst({
          where: {
            submissionId,
            isLocked: true,
          },
        });

        if (existingAssignment) {
          console.log(
            `Skipping submission ${submissionId} - has locked assignment`,
          );
          continue;
        }

        // Check if target panel is locked
        const panel = await tx.panel.findUnique({
          where: { id: panelId },
          select: { isLocked: true },
        });

        if (panel?.isLocked) {
          console.log(`Skipping panel ${panelId} - panel is locked`);
          continue;
        }

        // Get the submission to find the teamId
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          select: { teamId: true },
        });

        if (!submission) {
          console.error(`Submission ${submissionId} not found`);
          continue;
        }

        // Create SubmissionAssignment record (unlocked by default for auto-assignments)
        await tx.submissionAssignment.create({
          data: {
            submissionId,
            panelId,
            isLocked: false,
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

// --- Manual Panel Management ---

export async function createManualPanel(data: {
  name: string;
  slotId: string;
  capacity?: number;
  notes?: string;
}) {
  try {
    await checkAdmin();

    const panel = await prisma.panel.create({
      data: {
        name: data.name,
        slotId: data.slotId,
        capacity: data.capacity || 5,
        notes: data.notes,
        isManual: true,
        isLocked: false,
      },
      include: {
        slot: true,
        judges: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submission: {
              include: {
                team: true,
                problemStatement: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/admin/panels");
    return { success: true, panel };
  } catch (error) {
    console.error("Failed to create manual panel:", error);
    return { error: "Failed to create panel" };
  }
}

export async function updatePanelAction(
  panelId: string,
  updates: {
    name?: string;
    capacity?: number;
    slotId?: string;
    notes?: string;
  },
) {
  try {
    await checkAdmin();

    const panel = await prisma.panel.update({
      where: { id: panelId },
      data: updates,
      include: {
        slot: true,
        judges: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submission: {
              include: {
                team: true,
                problemStatement: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/admin/panels");
    return { success: true, panel };
  } catch (error) {
    console.error("Failed to update panel:", error);
    return { error: "Failed to update panel" };
  }
}

export async function assignJudgeToPanelAction(data: {
  judgeId: string;
  panelId: string;
  validateConflicts?: boolean;
}) {
  try {
    await checkAdmin();

    if (data.validateConflicts !== false) {
      // Check if panel exists and get its slot
      const panel = await prisma.panel.findUnique({
        where: { id: data.panelId },
        select: { id: true, slotId: true, isLocked: true },
      });

      if (!panel) {
        return { error: "Panel not found" };
      }

      if (panel.isLocked) {
        return { error: "Panel is locked and cannot be modified" };
      }

      // Check if judge is available for this slot
      if (panel.slotId) {
        const availability = await prisma.judgeAvailability.findUnique({
          where: {
            judgeId_slotId: {
              judgeId: data.judgeId,
              slotId: panel.slotId,
            },
          },
        });

        if (!availability) {
          return {
            error: "Judge is not available for this slot",
            warning: true,
          };
        }

        // Check if judge is already in another panel for the same slot
        const existingAssignment = await prisma.panelJudge.findFirst({
          where: {
            userId: data.judgeId,
            panel: {
              slotId: panel.slotId,
            },
          },
          include: {
            panel: true,
          },
        });

        if (existingAssignment) {
          return {
            error: `Judge is already assigned to panel "${existingAssignment.panel.name}" in this slot`,
          };
        }
      }
    }

    // Create the assignment
    await prisma.panelJudge.create({
      data: {
        panelId: data.panelId,
        userId: data.judgeId,
      },
    });

    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign judge:", error);
    return { error: "Failed to assign judge to panel" };
  }
}

export async function removeJudgeFromPanelAction(
  judgeId: string,
  panelId: string,
) {
  try {
    await checkAdmin();

    // Check if panel is locked
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
      select: { isLocked: true },
    });

    if (panel?.isLocked) {
      return { error: "Panel is locked and cannot be modified" };
    }

    await prisma.panelJudge.deleteMany({
      where: {
        panelId,
        userId: judgeId,
      },
    });

    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove judge:", error);
    return { error: "Failed to remove judge from panel" };
  }
}

export async function assignSubmissionToPanelAction(data: {
  submissionId: string;
  panelId: string;
  isLocked?: boolean;
}) {
  try {
    await checkAdmin();

    // Check panel capacity and lock status
    const panel = await prisma.panel.findUnique({
      where: { id: data.panelId },
      select: {
        id: true,
        capacity: true,
        isLocked: true,
        _count: {
          select: { submissions: true },
        },
        judges: {
          select: { userId: true },
        },
      },
    });

    if (!panel) {
      return { error: "Panel not found" };
    }

    if (panel.isLocked) {
      return { error: "Panel is locked and cannot accept new assignments" };
    }

    if (panel._count.submissions >= panel.capacity) {
      return {
        error: `Panel is at full capacity (${panel.capacity}/${panel.capacity})`,
        warning: true,
      };
    }

    // Check if submission already assigned to this panel
    const existing = await prisma.submissionAssignment.findUnique({
      where: {
        submissionId_panelId: {
          submissionId: data.submissionId,
          panelId: data.panelId,
        },
      },
    });

    if (existing) {
      return { error: "Submission already assigned to this panel" };
    }

    // Get submission to find teamId
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      select: { teamId: true },
    });

    if (!submission) {
      return { error: "Submission not found" };
    }

    // Create assignment in a transaction
    await prisma.$transaction(async (tx) => {
      // Create SubmissionAssignment
      await tx.submissionAssignment.create({
        data: {
          submissionId: data.submissionId,
          panelId: data.panelId,
          isLocked: data.isLocked || false,
        },
      });

      // Create JudgeAssignment for each judge in the panel
      for (const panelJudge of panel.judges) {
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
          update: {},
        });
      }
    });

    revalidatePath("/admin/panels");
    revalidatePath("/admin/panels/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign submission:", error);
    return { error: "Failed to assign submission to panel" };
  }
}

export async function removeSubmissionFromPanelAction(
  submissionId: string,
  panelId: string,
) {
  try {
    await checkAdmin();

    // Check if assignment is locked
    const assignment = await prisma.submissionAssignment.findUnique({
      where: {
        submissionId_panelId: {
          submissionId,
          panelId,
        },
      },
      select: {
        isLocked: true,
        submission: {
          select: { teamId: true },
        },
      },
    });

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    if (assignment.isLocked) {
      return { error: "Assignment is locked and cannot be removed" };
    }

    // Get panel judges to remove judge assignments
    const panelJudges = await prisma.panelJudge.findMany({
      where: { panelId },
      select: { userId: true },
    });

    // Remove in transaction
    await prisma.$transaction(async (tx) => {
      // Remove submission assignment
      await tx.submissionAssignment.delete({
        where: {
          submissionId_panelId: {
            submissionId,
            panelId,
          },
        },
      });

      // Remove judge assignments (only if team has no other submissions in panels with these judges)
      for (const panelJudge of panelJudges) {
        await tx.judgeAssignment.deleteMany({
          where: {
            judgeId: panelJudge.userId,
            teamId: assignment.submission.teamId,
          },
        });
      }
    });

    revalidatePath("/admin/panels");
    revalidatePath("/admin/panels/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove submission:", error);
    return { error: "Failed to remove submission from panel" };
  }
}

export async function moveSubmissionBetweenPanels(data: {
  submissionId: string;
  fromPanelId: string;
  toPanelId: string;
}) {
  try {
    await checkAdmin();

    // Check locks and capacity
    const [fromPanel, toPanel, assignment] = await Promise.all([
      prisma.panel.findUnique({
        where: { id: data.fromPanelId },
        select: { isLocked: true },
      }),
      prisma.panel.findUnique({
        where: { id: data.toPanelId },
        select: {
          id: true,
          capacity: true,
          isLocked: true,
          _count: { select: { submissions: true } },
        },
      }),
      prisma.submissionAssignment.findUnique({
        where: {
          submissionId_panelId: {
            submissionId: data.submissionId,
            panelId: data.fromPanelId,
          },
        },
        select: { isLocked: true },
      }),
    ]);

    if (assignment?.isLocked) {
      return { error: "Assignment is locked and cannot be moved" };
    }

    if (toPanel?.isLocked) {
      return { error: "Destination panel is locked" };
    }

    if (!toPanel) {
      return { error: "Destination panel not found" };
    }

    if (toPanel._count.submissions >= toPanel.capacity) {
      return { error: "Destination panel is at full capacity" };
    }

    // Remove from old panel and add to new panel
    const removeResult = await removeSubmissionFromPanelAction(
      data.submissionId,
      data.fromPanelId,
    );

    if (removeResult.error) {
      return removeResult;
    }

    const assignResult = await assignSubmissionToPanelAction({
      submissionId: data.submissionId,
      panelId: data.toPanelId,
    });

    return assignResult;
  } catch (error) {
    console.error("Failed to move submission:", error);
    return { error: "Failed to move submission between panels" };
  }
}

export async function reorderPanelJudges(
  panelId: string,
  judgeOrders: Array<{ judgeId: string; order: number }>,
) {
  try {
    await checkAdmin();

    await prisma.$transaction(
      judgeOrders.map(({ judgeId, order }) =>
        prisma.panelJudge.updateMany({
          where: {
            panelId,
            userId: judgeId,
          },
          data: {
            manualOrder: order,
          },
        }),
      ),
    );

    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder judges:", error);
    return { error: "Failed to reorder panel judges" };
  }
}

export async function togglePanelLock(panelId: string) {
  try {
    await checkAdmin();

    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
      select: { isLocked: true },
    });

    if (!panel) {
      return { error: "Panel not found" };
    }

    await prisma.panel.update({
      where: { id: panelId },
      data: { isLocked: !panel.isLocked },
    });

    revalidatePath("/admin/panels");
    return { success: true, isLocked: !panel.isLocked };
  } catch (error) {
    console.error("Failed to toggle panel lock:", error);
    return { error: "Failed to toggle panel lock" };
  }
}

export async function toggleAssignmentLock(
  submissionId: string,
  panelId: string,
) {
  try {
    await checkAdmin();

    const assignment = await prisma.submissionAssignment.findUnique({
      where: {
        submissionId_panelId: {
          submissionId,
          panelId,
        },
      },
      select: { isLocked: true },
    });

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    await prisma.submissionAssignment.update({
      where: {
        submissionId_panelId: {
          submissionId,
          panelId,
        },
      },
      data: { isLocked: !assignment.isLocked },
    });

    revalidatePath("/admin/panels");
    revalidatePath("/admin/panels/assignments");
    return { success: true, isLocked: !assignment.isLocked };
  } catch (error) {
    console.error("Failed to toggle assignment lock:", error);
    return { error: "Failed to toggle assignment lock" };
  }
}

export async function getSuggestedAssignments(filter?: {
  panelId?: string;
  slotId?: string;
}) {
  try {
    await checkAdmin();

    // Fetch unassigned submissions (not locked)
    const submissions = await prisma.submission.findMany({
      where: {
        assignments: {
          none: {},
        },
      },
      include: {
        team: true,
        problemStatement: true,
      },
    });

    // Fetch panels based on filter
    const panelWhere: any = {};
    if (filter?.panelId) {
      panelWhere.id = filter.panelId;
    } else if (filter?.slotId) {
      panelWhere.slotId = filter.slotId;
    }

    // Only suggest for unlocked panels
    panelWhere.isLocked = false;

    const panels = await prisma.panel.findMany({
      where: panelWhere,
      include: {
        slot: true,
        judges: {
          include: {
            user: true,
          },
        },
        submissions: true,
        _count: {
          select: { submissions: true },
        },
      },
    });

    // Map to allocation types
    const normalizeTrack = (track: string) => {
      const upper = track.toUpperCase();
      if (upper.includes("AI") || upper.includes("ML")) return "AI";
      if (upper.includes("WEB3") || upper.includes("BLOCK")) return "Web3";
      if (upper.includes("DEFENSE") || upper.includes("CYBER"))
        return "Defense";
      return "AI";
    };

    const allocSubmissions: AllocationSubmission[] = submissions.map((s) => ({
      id: s.id,
      track: normalizeTrack(s.problemStatement.track),
      teamId: s.teamId,
    }));

    const allocPanels = panels.map((p) => {
      const judgesList = p.judges.map((j) => ({
        id: j.userId,
        name: j.user.name,
        trackPreferences: (j.user.trackPreferences as Record<
          "AI" | "Web3" | "Defense",
          number
        >) || {
          AI: 0,
          Web3: 0,
          Defense: 0,
        },
      }));

      const trackScores = computePanelTrackScores(judgesList);

      return {
        id: p.id,
        name: p.name,
        capacity: p.capacity,
        currentLoad: p._count.submissions,
        judges: judgesList,
        trackScore: trackScores,
      };
    });

    // Run assignment algorithm
    const assignments = assignSubmissions(
      allocSubmissions,
      allocPanels,
      "equal-distribution",
    );

    // Build suggested assignments with details
    const suggestions = Object.entries(assignments).map(
      ([submissionId, panelId]) => {
        const submission = submissions.find((s) => s.id === submissionId)!;
        const panel = panels.find((p) => p.id === panelId)!;

        return {
          submissionId,
          panelId,
          teamName: submission.team.name,
          teamCode: submission.team.teamCode,
          psTitle: submission.problemStatement.title,
          track: normalizeTrack(submission.problemStatement.track),
          panelName: panel.name,
          compatibility: panel.judges.length > 0 ? "High" : "Low",
        };
      },
    );

    // Group by panel
    const suggestionsByPanel = panels.map((panel) => {
      const panelSuggestions = suggestions.filter(
        (s) => s.panelId === panel.id,
      );

      return {
        panelId: panel.id,
        panelName: panel.name,
        slotName: panel.slot?.name,
        capacity: panel.capacity,
        currentLoad: panel._count.submissions,
        suggestedCount: panelSuggestions.length,
        suggestions: panelSuggestions,
      };
    });

    return {
      success: true,
      suggestions,
      suggestionsByPanel,
      stats: {
        totalUnassigned: submissions.length,
        suggested: Object.keys(assignments).length,
      },
    };
  } catch (error) {
    console.error("Failed to get suggested assignments:", error);
    return { error: "Failed to generate suggestions" };
  }
}
