/** @format */

"use server";

import { prisma } from "@power/db";
import { randomUUID } from "crypto";
import {
  generateIncompleteTeamEmail,
  generateUnsubmittedTeamEmail,
  generateInaugurationInviteEmail,
} from "@/lib/email-templates";
import { enqueueSendMail } from "@power/job-runtime/enqueueSendMail";

export type EmailPreset =
  | "INCOMPLETE_TEAM"
  | "UNSUBMITTED_TEAM"
  | "INAUGURATION_INVITE"
  | "CUSTOM";

export type EmailListOption =
  | "TEAM_SIZE_1"
  | "TEAM_SIZE_2"
  | "TEAM_SIZE_3"
  | "UNSUBMITTED_TEAM"
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

      case "UNSUBMITTED_TEAM": {
        // Query from Analytics table for users with unsubmitted teams
        const unsubmittedUsers = await prisma.analytics.findMany({
          where: {
            submitted: "No",
          },
          select: {
            userEmail: true,
          },
        });

        const emails = unsubmittedUsers.map((u) => u.userEmail);

        return {
          success: true,
          emails: [...new Set(emails)],
          count: emails.length,
        };
      }

      case "ALL_PARTICIPANTS": {
        const participants = await prisma.tempTeamMembers.findMany({});

        const emails = participants.map((p) => p.userEmail);

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
export async function sendEmails(
  emails: string[],
  preset: EmailPreset,
  customData?: {
    cc?: string;
    bcc?: string;
    subject?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
      cid?: string;
    }>;
  },
) {
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

        // Get user IDs for tracking
        // const users = await prisma.user.findMany({
        //   where: { email: { in: emails } },
        //   select: { id: true, email: true },
        // });

        // const userIdMap = new Map(users.map((u) => [u.email, u.id]));

        // Get all recipient data from analytics table (single query!)
        const analyticsData = await prisma.analytics.findMany({
          where: { userEmail: { in: emails } },
          select: {
            id: true,
            userEmail: true,
            userName: true,
            teamName: true,
            teamCode: true,
          },
        });

        // Get team member counts for all teams
        const teamCodes = [...new Set(analyticsData.map((a) => a.teamCode))];
        const teamMemberCounts = await prisma.analytics.groupBy({
          by: ["teamCode"],
          where: { teamCode: { in: teamCodes } },
          _count: { userEmail: true },
        });

        const memberCountMap = new Map(
          teamMemberCounts.map((t) => [t.teamCode, t._count.userEmail]),
        );

        // Create email map for easy lookup
        const analyticsMap = new Map(
          analyticsData.map((a) => [a.userEmail, a]),
        );

        const queuedJobs = await Promise.all(
          emails.map(async (email) => {
            // const userId = userIdMap.get(email);

            // if (!userId) {
            //   console.warn(`No user ID found for ${email}, skipping`);
            //   return;
            // }

            const analytics = analyticsMap.get(email);

            if (!analytics) {
              console.warn(`No analytics data found for ${email}, skipping`);
              return;
            }

            const teamData = {
              teamName: analytics.teamName,
              teamCode: analytics.teamCode,
              membersInTeam: memberCountMap.get(analytics.teamCode) || 1,
            };

            const { subject, html } = generateIncompleteTeamEmail(
              analytics.userName,
              teamData,
            );

            return enqueueSendMail({
              to: email,
              cc: customData?.cc?.split(", "),
              bcc: customData?.bcc?.split(", "),
              subject,
              html,
              attachments: customData?.attachments,
              userId: analytics.id,
              campaignId,
            });
          }),
        );

        return {
          success: true,
          sent: queuedJobs.filter(Boolean).length,
          failed: 0,
          message: `Queued ${queuedJobs.filter(Boolean).length} emails for delivery`,
        };
      }

      case "UNSUBMITTED_TEAM": {
        // Create a campaign ID for tracking
        const campaignId = randomUUID();

        // Get all recipient data from analytics table
        const analyticsData = await prisma.analytics.findMany({
          where: { userEmail: { in: emails } },
          select: {
            id: true,
            userEmail: true,
            userName: true,
            teamName: true,
            teamCode: true,
          },
        });

        // Get team member counts for all teams
        const teamCodes = [...new Set(analyticsData.map((a) => a.teamCode))];
        const teamMemberCounts = await prisma.analytics.groupBy({
          by: ["teamCode"],
          where: { teamCode: { in: teamCodes } },
          _count: { userEmail: true },
        });

        const memberCountMap = new Map(
          teamMemberCounts.map((t) => [t.teamCode, t._count.userEmail]),
        );

        // Create email map for easy lookup
        const analyticsMap = new Map(
          analyticsData.map((a) => [a.userEmail, a]),
        );

        const queuedJobs = await Promise.all(
          emails.map(async (email) => {
            const analytics = analyticsMap.get(email);

            if (!analytics) {
              console.warn(`No analytics data found for ${email}, skipping`);
              return;
            }

            const teamData = {
              teamName: analytics.teamName,
              teamCode: analytics.teamCode,
              membersInTeam: memberCountMap.get(analytics.teamCode) || 1,
            };

            const { subject, html } = generateUnsubmittedTeamEmail(
              analytics.userName,
              teamData,
            );

            return enqueueSendMail({
              to: email,
              cc: customData?.cc?.split(", "),
              bcc: customData?.bcc?.split(", "),
              subject,
              html,
              attachments: customData?.attachments,
              userId: analytics.id,
              campaignId,
            });
          }),
        );

        return {
          success: true,
          sent: queuedJobs.filter(Boolean).length,
          failed: 0,
          message: `Queued ${queuedJobs.filter(Boolean).length} emails for delivery`,
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

        const queuedJobs = await Promise.all(
          emails.map(async (email) => {
            const user = userMap.get(email);

            const recipientName = user?.name || "there";
            const userId = user?.id || `unknown-${email}`;

            const { subject, html } = generateInaugurationInviteEmail(
              recipientName,
              {
                eventDate: "1st February 2026",
                eventTime: "9:00 AM onwards",
                venue: "YouTube",
              },
            );

            return enqueueSendMail({
              to: email,
              cc: customData?.cc?.split(", "),
              bcc: customData?.bcc?.split(", "),
              subject,
              html,
              attachments: customData?.attachments,
              userId,
              campaignId,
            });
          }),
        );

        return {
          success: true,
          sent: queuedJobs.length,
          failed: 0,
          message: `Queued ${queuedJobs.length} inauguration invites for delivery`,
        };
      }

      case "CUSTOM": {
        if (!customData?.subject || !customData?.html) {
          return {
            success: false,
            error: "Custom emails require subject and HTML content",
            sent: 0,
            failed: 0,
          };
        }

        const campaignId = randomUUID();

        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true },
        });

        const userIdMap = new Map(users.map((u) => [u.email, u.id]));

        const queuedJobs = await Promise.all(
          emails.map(async (email) => {
            const userId = userIdMap.get(email) || `unknown-${email}`;

            return enqueueSendMail({
              to: email,
              cc: customData.cc?.split(", "),
              bcc: customData.bcc?.split(", "),
              subject: customData.subject!,
              html: customData.html!,
              attachments: customData.attachments,
              userId,
              campaignId,
            });
          }),
        );

        return {
          success: true,
          sent: queuedJobs.length,
          failed: 0,
          message: `Queued ${queuedJobs.length} custom emails for delivery`,
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
