/** @format */

"use server";

import { prisma } from "@power/db";

export async function getTeamAnalytics(teamCode: string) {
  const analytics = await prisma.analytics.findMany({
    where: {
      teamCode: teamCode,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return analytics;
}
