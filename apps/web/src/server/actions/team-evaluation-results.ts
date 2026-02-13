/** @format */

"use server";

import { prisma } from "@power/db";

export async function getTeamEvaluationResults(teamId: string) {
  try {
    // Fetch all submitted evaluations for this team
    const evaluations = await prisma.evaluation.findMany({
      where: {
        teamId,
        submittedAt: { not: null }, // Only submitted evaluations
      },
      include: {
        judge: {
          select: {
            name: true,
          },
        },
        scores: {
          include: {
            criterion: {
              select: {
                subject: true,
                fullMark: true,
                order: true,
              },
            },
          },
          orderBy: {
            criterion: {
              order: "asc",
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (evaluations.length === 0) {
      return {
        success: true,
        evaluations: [],
        radarData: [],
        totalScore: 0,
        averageScore: 0,
        judgeCount: 0,
      };
    }

    // Calculate average scores per criterion
    const criteriaMap = new Map<
      string,
      { subject: string; scores: number[]; maxScore: number }
    >();

    evaluations.forEach((evaluation) => {
      evaluation.scores.forEach((score) => {
        const key = score.criterion.subject;
        if (!criteriaMap.has(key)) {
          criteriaMap.set(key, {
            subject: key,
            scores: [],
            maxScore: score.criterion.fullMark,
          });
        }
        criteriaMap.get(key)!.scores.push(score.score);
      });
    });

    const radarData = Array.from(criteriaMap.entries()).map(([, data]) => {
      const average =
        data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      return {
        criterion: data.subject,
        averageScore: Math.round(average * 10) / 10, // Round to 1 decimal
        maxScore: data.maxScore,
      };
    });

    // Format evaluations for judge feedback list
    const formattedEvaluations = evaluations.map((evaluation) => {
      const criteriaTotal = evaluation.scores.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const totalScore = criteriaTotal + evaluation.extraPoints;

      return {
        judgeName: evaluation.judge.name,
        submittedAt: evaluation.submittedAt!,
        overallFeedback: evaluation.overallFeedback,
        extraPoints: evaluation.extraPoints,
        extraJustification: evaluation.extraJustification,
        scores: evaluation.scores.map((score) => ({
          criterion: score.criterion.subject,
          score: score.score,
          maxScore: score.criterion.fullMark,
          feedback: score.feedback,
        })),
        totalScore,
      };
    });

    // Calculate overall statistics
    const totalScore = formattedEvaluations.reduce(
      (sum, e) => sum + e.totalScore,
      0,
    );
    const averageScore = totalScore / formattedEvaluations.length;

    return {
      success: true,
      evaluations: formattedEvaluations,
      radarData,
      totalScore: Math.round(totalScore * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      judgeCount: evaluations.length,
    };
  } catch (error) {
    console.error("Failed to fetch team evaluation results:", error);
    return { error: "Failed to fetch evaluation results" };
  }
}
