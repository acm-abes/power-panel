/** @format */

"use server";

import { prisma } from "@power/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";

async function checkJudge() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { isJudge } = await getUserRoles(session.user.id);
  if (!isJudge) {
    throw new Error("Forbidden: Judge access required");
  }

  return session.user;
}

export async function getJudgeEvaluationDataAction(slotId: string) {
  try {
    const user = await checkJudge();

    // Get all teams assigned to this judge
    const judgeAssignments = await prisma.judgeAssignment.findMany({
      where: { judgeId: user.id },
      include: {
        team: {
          include: {
            submission: {
              include: {
                assignments: {
                  include: {
                    panel: {
                      select: {
                        id: true,
                        name: true,
                        slotId: true,
                        slot: true,
                      },
                    },
                  },
                },
                problemStatement: {
                  select: {
                    title: true,
                    track: true,
                  },
                },
              },
            },
            evaluations: {
              where: {
                judgeId: user.id,
              },
            },
          },
        },
      },
    });

    // Filter teams by slot - only show teams whose submissions are assigned to panels in this slot
    const teamsInSlot = judgeAssignments.filter((assignment) => {
      if (!assignment.team.submission) return false;

      // Check if any submission assignment belongs to a panel in this slot
      return assignment.team.submission.assignments.some(
        (sa) => sa.panel.slotId === slotId,
      );
    });

    // Get slot details
    const slot = await prisma.evaluationSlot.findUnique({
      where: { id: slotId },
    });

    return {
      success: true,
      teams: teamsInSlot.map((assignment) => ({
        id: assignment.team.id,
        name: assignment.team.name,
        teamCode: assignment.team.teamCode,
        submission: assignment.team.submission
          ? {
              id: assignment.team.submission.id,
              problemStatement:
                assignment.team.submission.problemStatement.title,
              track: assignment.team.submission.problemStatement.track,
              panelId: assignment.team.submission.assignments[0]?.panel.id,
              panelName: assignment.team.submission.assignments[0]?.panel.name,
            }
          : null,
        hasEvaluation: assignment.team.evaluations.length > 0,
        isSubmitted: assignment.team.evaluations.some(
          (e) => e.submittedAt !== null,
        ),
      })),
      slot,
    };
  } catch (error) {
    console.error("Failed to fetch judge evaluation data:", error);
    return { error: "Failed to fetch evaluation data" };
  }
}

export async function getTeamEvaluationFormDataAction(
  teamId: string,
  slotId: string,
) {
  try {
    const user = await checkJudge();

    // Verify judge is assigned to this team
    const assignment = await prisma.judgeAssignment.findUnique({
      where: {
        judgeId_teamId: {
          judgeId: user.id,
          teamId,
        },
      },
    });

    if (!assignment) {
      return { error: "You are not assigned to evaluate this team" };
    }

    // Fetch team details with submission
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        submission: {
          include: {
            problemStatement: {
              select: {
                title: true,
                track: true,
                content: true,
              },
            },
            assignments: {
              include: {
                panel: {
                  select: {
                    id: true,
                    name: true,
                    slotId: true,
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return { error: "Team not found" };
    }

    // Verify team's submission is assigned to a panel in the specified slot
    const isInSlot = team.submission?.assignments.some(
      (sa) => sa.panel.slotId === slotId,
    );

    if (!isInSlot) {
      return { error: "This team is not in the selected evaluation slot" };
    }

    // Fetch evaluation criteria
    const criteria = await prisma.evaluationCriterion.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    // Fetch existing evaluation (draft or submitted)
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        judgeId_teamId: {
          judgeId: user.id,
          teamId,
        },
      },
      include: {
        scores: {
          include: {
            criterion: true,
          },
        },
      },
    });

    return {
      success: true,
      team: {
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        members: team.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
        })),
        submission: team.submission
          ? {
              id: team.submission.id,
              problemStatement: {
                title: team.submission.problemStatement.title,
                track: team.submission.problemStatement.track,
                content: team.submission.problemStatement.content,
              },
              documentPath: team.submission.documentPath,
              pptPath: team.submission.pptPath,
            }
          : null,
      },
      criteria,
      existingEvaluation: existingEvaluation
        ? {
            id: existingEvaluation.id,
            submittedAt: existingEvaluation.submittedAt,
            overallFeedback: existingEvaluation.overallFeedback,
            extraPoints: existingEvaluation.extraPoints,
            extraJustification: existingEvaluation.extraJustification,
            scores: existingEvaluation.scores.map((s) => ({
              criterionId: s.criterionId,
              score: s.score,
              feedback: s.feedback,
            })),
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to fetch team evaluation form data:", error);
    return { error: "Failed to fetch evaluation form data" };
  }
}

export async function submitEvaluationAction(data: {
  teamId: string;
  slotId: string;
  scores: {
    criterionId: string;
    score: number;
    feedback?: string;
  }[];
  overallFeedback: string;
  extraPoints?: number;
  extraJustification?: string;
  isDraft: boolean;
}) {
  try {
    const user = await checkJudge();

    // Verify judge is assigned to this team
    const assignment = await prisma.judgeAssignment.findUnique({
      where: {
        judgeId_teamId: {
          judgeId: user.id,
          teamId: data.teamId,
        },
      },
    });

    if (!assignment) {
      return { error: "You are not assigned to evaluate this team" };
    }

    // Validate scores
    if (data.scores.length === 0) {
      return { error: "Please provide scores for all criteria" };
    }

    // Validate overall feedback if submitting (not draft)
    if (!data.isDraft && !data.overallFeedback?.trim()) {
      return { error: "Overall feedback is required for submission" };
    }

    // Validate extra points justification
    if ((data.extraPoints ?? 0) > 0 && !data.extraJustification?.trim()) {
      return { error: "Justification is required when awarding extra points" };
    }

    await prisma.$transaction(async (tx) => {
      // Upsert evaluation
      const evaluation = await tx.evaluation.upsert({
        where: {
          judgeId_teamId: {
            judgeId: user.id,
            teamId: data.teamId,
          },
        },
        create: {
          judgeId: user.id,
          teamId: data.teamId,
          slotId: data.slotId,
          overallFeedback: data.overallFeedback,
          extraPoints: data.extraPoints ?? 0,
          extraJustification: data.extraJustification,
          submittedAt: data.isDraft ? null : new Date(),
        },
        update: {
          overallFeedback: data.overallFeedback,
          extraPoints: data.extraPoints ?? 0,
          extraJustification: data.extraJustification,
          submittedAt: data.isDraft ? undefined : new Date(),
          slotId: data.slotId,
        },
      });

      // Delete existing scores
      await tx.evaluationScore.deleteMany({
        where: { evaluationId: evaluation.id },
      });

      // Create new scores
      for (const score of data.scores) {
        await tx.evaluationScore.create({
          data: {
            evaluationId: evaluation.id,
            criterionId: score.criterionId,
            score: score.score,
            feedback: score.feedback,
          },
        });
      }
    });

    revalidatePath("/judges/evaluate");
    revalidatePath(`/judges/evaluate/${data.teamId}`);

    return {
      success: true,
      message: data.isDraft
        ? "Draft saved successfully"
        : "Evaluation submitted successfully",
    };
  } catch (error) {
    console.error("Failed to submit evaluation:", error);
    return { error: "Failed to submit evaluation" };
  }
}

export async function getJudgeAvailableSlotsAction() {
  try {
    const user = await checkJudge();

    const availabilities = await prisma.judgeAvailability.findMany({
      where: { judgeId: user.id },
      include: {
        slot: true,
      },
      orderBy: {
        slot: {
          day: "asc",
        },
      },
    });

    return {
      success: true,
      slots: availabilities.map((a) => a.slot),
    };
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return { error: "Failed to fetch available slots" };
  }
}
