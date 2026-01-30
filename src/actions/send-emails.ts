/** @format */

"use server";

import { prisma } from "@/lib/prisma";
import { sendAlertEmail } from "@/email/scripts/alert";

export type EmailPreset = "INCOMPLETE_TEAM" | "CUSTOM";

export type EmailListOption =
  | "TEAM_SIZE_1"
  | "TEAM_SIZE_2"
  | "TEAM_SIZE_3"
  | "ALL_PARTICIPANTS"
  | "ALL_JUDGES"
  | "ALL_MENTORS"
  | "CUSTOM";

/**
 * Get emails based on a predefined list option
 */
export async function getEmailsByOption(option: EmailListOption) {
  try {
    switch (option) {
      case "TEAM_SIZE_1": {
        // Query from TempTeamMembers for incomplete teams
        const tempTeamMembers = await prisma.tempTeamMembers.groupBy({
          by: ["teamId"],
          _count: {
            userEmail: true,
          },
          having: {
            userEmail: {
              _count: {
                equals: 1,
              },
            },
          },
        });

        const teamIds = tempTeamMembers.map((t) => t.teamId);

        const members = await prisma.tempTeamMembers.findMany({
          where: {
            teamId: {
              in: teamIds,
            },
          },
          select: {
            userEmail: true,
          },
        });

        const emails = members.map((m) => m.userEmail);

        return {
          success: true,
          emails: [...new Set(emails)], // Remove duplicates
          count: emails.length,
        };
      }

      case "TEAM_SIZE_2": {
        // Query from TempTeamMembers for incomplete teams
        const tempTeamMembers = await prisma.tempTeamMembers.groupBy({
          by: ["teamId"],
          _count: {
            userEmail: true,
          },
          having: {
            userEmail: {
              _count: {
                equals: 2,
              },
            },
          },
        });

        const teamIds = tempTeamMembers.map((t) => t.teamId);

        const members = await prisma.tempTeamMembers.findMany({
          where: {
            teamId: {
              in: teamIds,
            },
          },
          select: {
            userEmail: true,
          },
        });

        const emails = members.map((m) => m.userEmail);

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      case "TEAM_SIZE_3": {
        const teams = await prisma.team.findMany({
          where: {
            members: {
              some: {},
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        const emails = teams
          .filter((team) => team.members.length === 3)
          .flatMap((team) => team.members.map((m) => m.user.email));

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      case "ALL_PARTICIPANTS": {
        const participants = await prisma.userRole.findMany({
          where: {
            role: {
              name: "PARTICIPANT",
            },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        const emails = participants.map((p) => p.user.email);

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      case "ALL_JUDGES": {
        const judges = await prisma.userRole.findMany({
          where: {
            role: {
              name: "JUDGE",
            },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        const emails = judges.map((j) => j.user.email);

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      case "ALL_MENTORS": {
        const mentors = await prisma.userRole.findMany({
          where: {
            role: {
              name: "MENTOR",
            },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        const emails = mentors.map((m) => m.user.email);

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      default:
        return {
          success: false,
          emails: [],
          count: 0,
          error: "Invalid option",
        };
    }
  } catch (error) {
    console.error("Error fetching emails:", error);
    return {
      success: false,
      emails: [],
      count: 0,
      error: "Failed to fetch emails",
    };
  }
}

/**
 * Get incomplete teams data for alert emails
 */
export async function getIncompleteTeamsData() {
  try {
    // Get all temp teams with member counts
    const tempTeamMembers = await prisma.tempTeamMembers.groupBy({
      by: ["teamId"],
      _count: {
        userEmail: true,
      },
      having: {
        userEmail: {
          _count: {
            lt: 4,
            gt: 0,
          },
        },
      },
    });

    const teamIds = tempTeamMembers.map((t) => t.teamId);

    // Get team details from TempTeamData
    const teams = await prisma.tempTeamData.findMany({
      where: {
        id: {
          in: teamIds,
        },
      },
    });

    // Get all members for these teams
    const members = await prisma.tempTeamMembers.findMany({
      where: {
        teamId: {
          in: teamIds,
        },
      },
    });

    // Group members by team
    const membersByTeam = members.reduce(
      (acc, member) => {
        if (!acc[member.teamId]) {
          acc[member.teamId] = [];
        }
        acc[member.teamId].push(member.userEmail);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const incompleteTeams = teams.map((team) => ({
      teamCode: team.teamCode,
      teamName: team.name,
      membersInTeam: membersByTeam[team.id]?.length || 0,
      emails: membersByTeam[team.id] || [],
    }));

    return {
      success: true,
      teams: incompleteTeams,
      count: incompleteTeams.length,
    };
  } catch (error) {
    console.error("Error fetching incomplete teams:", error);
    return {
      success: false,
      teams: [],
      count: 0,
      error: "Failed to fetch incomplete teams",
    };
  }
}

/**
 * Send emails based on preset and email list
 */
export async function sendEmails(emails: string[], preset: EmailPreset) {
  try {
    if (emails.length === 0) {
      return {
        success: false,
        error: "No emails provided",
        sent: 0,
        failed: 0,
      };
    }

    switch (preset) {
      case "INCOMPLETE_TEAM": {
        // Just fetch the team details needed for the email template
        // Trust the emails provided - no filtering or validation
        const tempMembers = await prisma.tempTeamMembers.findMany({
          where: {
            userEmail: { in: emails },
          },
        });

        if (tempMembers.length === 0) {
          return {
            success: false,
            error: "No team members found for the provided emails",
            sent: 0,
            failed: 0,
          };
        }

        // Get unique team IDs
        const teamIds = [...new Set(tempMembers.map((m) => m.teamId))];

        // Get team data for template
        const teams = await prisma.tempTeamData.findMany({
          where: {
            id: {
              in: teamIds,
            },
          },
        });

        // Get all members for these teams to populate email data
        const allMembers = await prisma.tempTeamMembers.findMany({
          where: {
            teamId: {
              in: teamIds,
            },
          },
        });

        // Group members by team
        const membersByTeam = allMembers.reduce(
          (acc, member) => {
            if (!acc[member.teamId]) {
              acc[member.teamId] = [];
            }
            acc[member.teamId].push(member.userEmail);
            return acc;
          },
          {} as Record<string, string[]>,
        );

        // Prepare team data for emails - NO FILTERING, just prepare data
        const teamData = teams.map((team) => ({
          teamCode: team.teamCode,
          teamName: team.name,
          membersInTeam: membersByTeam[team.id]?.length || 0,
          emails: membersByTeam[team.id] || [],
        }));

        const recipientDetails = await prisma.analytics.findMany({
          where: { userEmail: { in: emails } },
          select: { userEmail: true, userName: true },
        });

        // Send emails to all teams
        const results = await Promise.allSettled(
          teamData.map((team) =>
            sendAlertEmail({
              teamCode: team.teamCode,
              teamName: team.teamName,
              membersInTeam: team.membersInTeam,
              recipientDetails: recipientDetails.map((r) => ({
                name: r.userName,
                email: r.userEmail,
              })),
            }),
          ),
        );

        const successful = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          success: failed === 0,
          sent: successful,
          failed: failed,
          message: `Sent alerts to ${successful} teams${failed > 0 ? `, ${failed} failed` : ""}`,
        };
      }

      case "CUSTOM": {
        // For custom emails, we need a different implementation
        // This would require a generic email template
        return {
          success: false,
          error: "Custom email preset not implemented yet",
          sent: 0,
          failed: 0,
        };
      }

      default:
        return {
          success: false,
          error: "Invalid preset",
          sent: 0,
          failed: 0,
        };
    }
  } catch (error) {
    console.error("Error sending emails:", error);
    return {
      success: false,
      error: "Failed to send emails",
      sent: 0,
      failed: 0,
    };
  }
}
