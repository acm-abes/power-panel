/** @format */

"use server";

import { prisma } from "@power/db";
import { emailQueue } from "@/lib/queue";
import { randomUUID } from "crypto";

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
 * Generate HTML email for incomplete team alert
 */
function generateIncompleteTeamEmailHTML(
  memberName: string,
  teamName: string,
  teamCode: string,
  membersInTeam: number,
) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <div style="max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#1a1a2e;padding:20px;text-align:center">
            <h1 style="color:#00d4ff;margin:0">Smart ABES Hackathon 2.0</h1>
            <p style="color:#aaa;margin:5px 0 0 0">Let's see whose Algorithm wins the Rhythm</p>
        </div>
       
<div style="background:#fff3cd;padding:15px;border-left:4px solid #ffc107;">
    ⚠️ <b>Action Required:</b> Your team has ${membersInTeam} members but registration is not yet submitted.<br>
    Please go to your Devfolio dashboard and click <b>"Submit Registration"</b> before 13th February 2026.
</div>

        <div style="padding:20px;background:#f9f9f9">
            <p>Dear <strong>${memberName}</strong>,</p>
           
            <p>Greetings from SAH 2.0 Organizing Team!</p>
           
            <p>Thank you for registering for <b>Smart ABES Hackathon 2.0</b>. We're excited to have your team on board!</p>
           
            <br><b>📅 Important Dates:</b>
            <ul>
                <li><b>Team Completion Deadline:</b> 1st February 2026</li>
                <li><b>Round 1 Evaluation:</b> 14-15 February 2026</li>
                <li><b>Mentoring Phase:</b> 16-27 February 2026</li>
                <li><b>Grand Finale:</b> 28 February 2026 @ ABES EC</li>
            </ul>
           
            <div style="background:#e8f4f8;padding:15px;border-left:4px solid #00d4ff;margin:20px 0">
                <strong>Your Team Details:</strong><br>
                Team Name: ${teamName}<br>
                Team Code: ${teamCode}<br>
                Members: ${membersInTeam}/4
            </div>
           
            <div>
              <p>
              For any queries, refer to our <b><a href="https://smartabeshackathon.tech/contacts">contact page</a></b>
              <br/>or<br/>
              Mail us at <b><a href="mailto:organizer@smartabeshackathon.tech">organizer@smartabeshackathon.tech</a></b></p>
              <p>If you want us to pair you with someone else, mail us at <b><a href="mailto:support@smartabeshackathon.tech">support@smartabeshackathon.tech</a></b></p>
            </div>
           
            <p>Best Regards,<br>
            <strong>SAH 2.0 Organizing Committee</strong><br>
        </div>
       
        <div style="background:#1a1a2e;padding:10px;text-align:center">
            <p style="color:#888;font-size:12px;margin:0">
                Smart ABES Hackathon 2.0 | February 2026
            </p>
        </div>
    </div>
</div>
</body>
</html>`;
}

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

        // Fetch team details and recipient info
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

        // Get all members for these teams
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

        // Get recipient details (name + email)
        const recipientDetails = await prisma.analytics.findMany({
          where: { userEmail: { in: emails } },
          select: { userEmail: true, userName: true },
        });

        // Get user IDs for the email jobs
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true },
        });

        const userIdMap = new Map(users.map((u) => [u.email, u.id]));
        const recipientMap = new Map(
          recipientDetails.map((r) => [r.userEmail, r.userName]),
        );

        // Enqueue email jobs for each recipient
        const emailJobs = [];
        for (const member of tempMembers) {
          const team = teams.find((t) => t.id === member.teamId);
          if (!team) continue;

          const userId = userIdMap.get(member.userEmail);
          if (!userId) continue;

          const memberName = recipientMap.get(member.userEmail) || "Participant";
          const membersInTeam = membersByTeam[team.id]?.length || 0;

          const html = generateIncompleteTeamEmailHTML(
            memberName,
            team.teamName,
            team.teamCode,
            membersInTeam,
          );

          emailJobs.push(
            emailQueue.enqueue({
              to: member.userEmail,
              subject: `SAH 2.0 | ${team.teamName} - Registration Status Update`,
              html,
              campaignId,
              userId,
            }),
          );
        }

        // Wait for all jobs to be enqueued
        await Promise.all(emailJobs);

        return {
          success: true,
          sent: emailJobs.length,
          failed: 0,
          message: `Queued ${emailJobs.length} emails for delivery`,
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
