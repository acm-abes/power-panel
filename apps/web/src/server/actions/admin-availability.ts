/** @format */

"use server";

import { prisma } from "@power/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }

  return session.user;
}

export async function getAvailabilityMatrixAction() {
  try {
    await checkAdmin();

    // Fetch all judges
    const judges = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { name: "JUDGE" },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        judgeAvailabilities: {
          select: {
            slotId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Fetch all slots
    const slots = await prisma.evaluationSlot.findMany({
      orderBy: [{ day: "asc" }, { slotOrder: "asc" }],
      select: {
        id: true,
        name: true,
        day: true,
        startTime: true,
        endTime: true,
        slotOrder: true,
      },
    });

    return { success: true, judges, slots };
  } catch (error) {
    console.error("Failed to fetch availability matrix:", error);
    return { error: "Failed to fetch availability matrix" };
  }
}

export async function toggleJudgeAvailabilityAction(
  judgeId: string,
  slotId: string,
  isAvailable: boolean,
) {
  try {
    await checkAdmin();

    if (isAvailable) {
      // Create availability
      await prisma.judgeAvailability.upsert({
        where: {
          judgeId_slotId: {
            judgeId,
            slotId,
          },
        },
        create: {
          judgeId,
          slotId,
        },
        update: {},
      });
    } else {
      // Remove availability
      await prisma.judgeAvailability.deleteMany({
        where: {
          judgeId,
          slotId,
        },
      });
    }

    revalidatePath("/admin/judges/availability");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle availability:", error);
    return { error: "Failed to toggle availability" };
  }
}

export async function bulkSetAvailabilityAction(
  judgeIds: string[],
  slotId: string,
  isAvailable: boolean,
) {
  try {
    await checkAdmin();

    if (isAvailable) {
      // Create availabilities for all judges
      await prisma.$transaction(
        judgeIds.map((judgeId) =>
          prisma.judgeAvailability.upsert({
            where: {
              judgeId_slotId: {
                judgeId,
                slotId,
              },
            },
            create: {
              judgeId,
              slotId,
            },
            update: {},
          }),
        ),
      );
    } else {
      // Remove availabilities for all judges
      await prisma.judgeAvailability.deleteMany({
        where: {
          judgeId: { in: judgeIds },
          slotId,
        },
      });
    }

    revalidatePath("/admin/judges/availability");
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk set availability:", error);
    return { error: "Failed to bulk set availability" };
  }
}

export async function clearJudgeAvailabilityAction(judgeId: string) {
  try {
    await checkAdmin();

    await prisma.judgeAvailability.deleteMany({
      where: { judgeId },
    });

    revalidatePath("/admin/judges/availability");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear judge availability:", error);
    return { error: "Failed to clear judge availability" };
  }
}
