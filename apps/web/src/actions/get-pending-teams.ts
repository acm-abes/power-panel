/** @format */

"use server";

import { prisma } from "@power/db";

export type PendingTeamMember = {
  id: string;
  userEmail: string;
  hasSignedIn: boolean;
  userId?: string;
  userName?: string;
};

export type PendingTeam = {
  id: string;
  name: string;
  members: PendingTeamMember[];
  status: "complete" | "partial" | "incomplete";
};

export async function getPendingTeams(): Promise<PendingTeam[]> {
  // Fetch all temp teams
  const tempTeams = await prisma.tempTeamData.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all temp team members
  const tempMembers = await prisma.tempTeamMembers.findMany({
    orderBy: {
      teamId: "asc",
    },
  });

  // Get all users to check who has signed in
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // Create a map of emails to users for quick lookup
  const userEmailMap = new Map(
    users.map((user) => [user.email.toLowerCase(), user]),
  );

  // Build the pending teams with their members
  const pendingTeams: PendingTeam[] = tempTeams.map((team) => {
    const teamMembers = tempMembers
      .filter((member) => member.teamId === team.id)
      .map((member) => {
        const user = userEmailMap.get(member.userEmail.toLowerCase());
        return {
          id: member.id,
          userEmail: member.userEmail,
          hasSignedIn: !!user,
          userId: user?.id,
          userName: user?.name,
        };
      });

    // Determine team status
    const memberCount = teamMembers.length;
    const signedInCount = teamMembers.filter((m) => m.hasSignedIn).length;

    let status: "complete" | "partial" | "incomplete";
    if (memberCount >= 2 && memberCount <= 4) {
      if (signedInCount === memberCount) {
        status = "complete";
      } else {
        status = "partial";
      }
    } else {
      status = "incomplete";
    }

    return {
      id: team.id,
      name: team.name,
      members: teamMembers,
      status,
    };
  });

  return pendingTeams;
}
