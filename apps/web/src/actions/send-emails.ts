/** @format */

"use server";

import { prisma } from "@power/db";
import { emailQueue } from "@/lib/queue";
import { randomUUID } from "crypto";

export type EmailPreset = "INCOMPLETE_TEAM" | "INAUGURATION_INVITE" | "CUSTOM";

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
        // Create a campaign ID for tracking
        const campaignId = randomUUID();

        // Get user IDs for tracking (create default if not found)
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true },
        });
        const userIdMap = new Map(users.map((u) => [u.email, u.id]));

        // Get team and recipient data (best effort)
        const tempMembers = await prisma.tempTeamMembers.findMany({
          where: { userEmail: { in: emails } },
        });

        const teamIds = [...new Set(tempMembers.map((m) => m.teamId))];
        const teams = await prisma.tempTeamData.findMany({
          where: { id: { in: teamIds } },
        });

        const allMembers = await prisma.tempTeamMembers.findMany({
          where: { teamId: { in: teamIds } },
        });

        const membersByTeam = allMembers.reduce(
          (acc, member) => {
            if (!acc[member.teamId]) acc[member.teamId] = [];
            acc[member.teamId].push(member.userEmail);
            return acc;
          },
          {} as Record<string, string[]>,
        );

        const recipientDetails = await prisma.analytics.findMany({
          where: { userEmail: { in: emails } },
          select: { userEmail: true, userName: true },
        });
        const recipientMap = new Map(
          recipientDetails.map((r) => [r.userEmail, r.userName]),
        );

        // Queue job for EVERY email provided, no filtering
        let jobCount = 0;

        for (const email of emails) {
          const userId = userIdMap.get(email);
          if (!userId) {
            console.warn(`No user ID found for ${email}, skipping`);
            continue;
          }

          const recipientName = recipientMap.get(email) || "Participant";
          const member = tempMembers.find((m) => m.userEmail === email);
          const team = member
            ? teams.find((t) => t.id === member.teamId)
            : null;

          // Use team data if available, otherwise use defaults
          const templateData = team
            ? {
                teamName: team.name,
                teamCode: team.teamCode,
                membersInTeam: membersByTeam[team.id]?.length || 1,
              }
            : {
                teamName: "Your Team",
                teamCode: "N/A",
                membersInTeam: 1,
              };

          // Enqueue without any restrictions
          emailQueue.enqueue({
            to: email,
            recipientName,
            userId,
            template: "INCOMPLETE_TEAM",
            templateData,
            campaignId,
          });

          jobCount++;
        }

        return {
          success: true,
          sent: jobCount,
          failed: 0,
          message: `Queued ${jobCount} emails for delivery`,
        };
      }

      case "INAUGURATION_INVITE": {
        // Create a campaign ID for tracking
        const campaignId = randomUUID();

        // Try to get names from user table first
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true, name: true },
        });
        const userMap = new Map(
          users.map((u) => [u.email, { id: u.id, name: u.name }]),
        );

        // For emails not in user table, try analytics table
        const missingEmails = emails.filter((e) => !userMap.has(e));
        if (missingEmails.length > 0) {
          const analyticsUsers = await prisma.analytics.findMany({
            where: { userEmail: { in: missingEmails } },
            select: { userEmail: true, userName: true },
          });

          for (const au of analyticsUsers) {
            // Use a placeholder ID since analytics doesn't have user.id
            userMap.set(au.userEmail, {
              id: `analytics-${au.userEmail}`,
              name: au.userName,
            });
          }
        }

        let jobCount = 0;

        for (const email of emails) {
          const user = userMap.get(email);

          // Use "there" as fallback if no name found
          const recipientName = user?.name || "there";
          const userId = user?.id || `unknown-${email}`;

          // Simple invitation - no team details needed
          emailQueue.enqueue({
            to: email,
            recipientName,
            userId: userId,
            template: "INAUGURATION_INVITE",
            templateData: {
              eventDate: "1st February 2026",
              eventTime: "9:00 AM onwards",
              venue: "YouTube",
            },
            campaignId,
          });

          jobCount++;
        }

        return {
          success: true,
          sent: jobCount,
          failed: 0,
          message: `Queued ${jobCount} inauguration invites for delivery`,
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
