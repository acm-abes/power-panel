/** @format */

"use client";

import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

type TeamScore = {
  id: string;
  name: string;
  teamCode: string;
  evaluationCount: number;
  averageScore: number;
  totalScore: number;
  members: Array<{
    user: {
      name: string;
      email: string;
    };
  }>;
  evaluations: Array<{
    judge: {
      name: string;
    };
    extraPoints: number;
    extraJustification?: string | null;
    overallFeedback?: string | null;
    scores: Array<{
      score: number;
      feedback?: string | null;
      criterion: {
        subject: string;
        fullMark: number;
      };
    }>;
  }>;
};

interface DownloadButtonProps {
  teamsWithScores: TeamScore[];
}

export function DownloadButton({ teamsWithScores }: DownloadButtonProps) {
  const handleDownload = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Rankings
    const rankingsData = teamsWithScores.map((team, index) => ({
      Rank: index + 1,
      "Team Name": team.name,
      "Team Code": team.teamCode,
      Members: team.members.length,
      "Number of Evaluations": team.evaluationCount,
      "Average Score": parseFloat(team.averageScore.toFixed(2)),
      "Total Score": parseFloat(team.totalScore.toFixed(2)),
    }));

    const rankingsSheet = XLSX.utils.json_to_sheet(rankingsData);
    XLSX.utils.book_append_sheet(workbook, rankingsSheet, "Rankings");

    // Sheet 2: Average Scores by Parameter
    const criteriaMap = new Map<
      string,
      { total: number; count: number; fullMark: number }
    >();
    teamsWithScores.forEach((team) => {
      team.evaluations.forEach((evaluation) => {
        evaluation.scores.forEach((score) => {
          const key = score.criterion.subject;
          const existing = criteriaMap.get(key) || {
            total: 0,
            count: 0,
            fullMark: score.criterion.fullMark,
          };
          existing.total += score.score;
          existing.count += 1;
          criteriaMap.set(key, existing);
        });
      });
    });

    const avgParamData = Array.from(criteriaMap.entries()).map(
      ([param, data]) => ({
        Parameter: param,
        "Average Score": parseFloat((data.total / data.count).toFixed(2)),
        "Full Marks": data.fullMark,
        "Total Evaluations": data.count,
      }),
    );

    if (avgParamData.length > 0) {
      const avgParamSheet = XLSX.utils.json_to_sheet(avgParamData);
      XLSX.utils.book_append_sheet(workbook, avgParamSheet, "Avg by Parameter");
    }

    // Sheet 2: Detailed Scores
    const detailedData: any[] = [];
    teamsWithScores.forEach((team) => {
      team.evaluations.forEach((evaluation) => {
        const evalTotal = evaluation.scores.reduce(
          (sum, score) => sum + score.score,
          0,
        );

        const row: any = {
          "Team Name": team.name,
          "Team Code": team.teamCode,
          "Judge Name": evaluation.judge.name,
          "Total Score": evalTotal + evaluation.extraPoints,
        };

        // Add individual criterion scores and feedback
        evaluation.scores.forEach((score) => {
          row[`${score.criterion.subject} - Score`] =
            `${score.score}/${score.criterion.fullMark}`;
          row[`${score.criterion.subject} - Feedback`] = score.feedback || "";
        });

        // Add extra points and justification
        row["Extra Points"] = evaluation.extraPoints;
        row["Extra Points Reason"] = evaluation.extraJustification || "";

        // Add overall feedback
        row["Final Review"] = evaluation.overallFeedback || "";

        detailedData.push(row);
      });
    });

    if (detailedData.length > 0) {
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detailed Scores");
    }

    // Sheet 4: Team Members
    const membersData: any[] = [];
    teamsWithScores.forEach((team) => {
      team.members.forEach((member) => {
        membersData.push({
          "Team Name": team.name,
          "Team Code": team.teamCode,
          "Member Name": member.user.name,
          "Member Email": member.user.email,
        });
      });
    });

    if (membersData.length > 0) {
      const membersSheet = XLSX.utils.json_to_sheet(membersData);
      XLSX.utils.book_append_sheet(workbook, membersSheet, "Team Members");
    }

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `evaluation-results-${timestamp}.xlsx`;

    // Write and download
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button onClick={handleDownload} variant="default">
      Download Results (Excel)
    </Button>
  );
}
