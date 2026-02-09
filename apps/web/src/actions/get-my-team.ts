/** @format */

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@power/db";
import { headers } from "next/headers";

export async function getMyTeam() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          submission: true,
          evaluations: {
            where: {
              submittedAt: {
                not: null,
              },
            },
            include: {
              judge: true,
              scores: {
                include: {
                  criterion: true,
                },
              },
            },
          },
          mentorFeedbacks: {
            include: {
              mentor: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  return teamMembership;
}
