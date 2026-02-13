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

export async function getSlotsAction() {
  try {
    await checkAdmin();

    const slots = await prisma.evaluationSlot.findMany({
      orderBy: [{ day: "asc" }, { slotOrder: "asc" }],
      include: {
        _count: {
          select: {
            panels: true,
            judgeAvailabilities: true,
          },
        },
      },
    });

    return { success: true, slots };
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    return { error: "Failed to fetch slots" };
  }
}

export async function createSlotAction(data: {
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  slotOrder: number;
}) {
  try {
    await checkAdmin();

    const slot = await prisma.evaluationSlot.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        slotOrder: data.slotOrder,
      },
    });

    revalidatePath("/admin/panels/slots");
    return { success: true, slot };
  } catch (error) {
    console.error("Failed to create slot:", error);
    return { error: "Failed to create slot" };
  }
}

export async function updateSlotAction(
  id: string,
  data: {
    name: string;
    day: number;
    startTime: string;
    endTime: string;
    slotOrder: number;
  },
) {
  try {
    await checkAdmin();

    const slot = await prisma.evaluationSlot.update({
      where: { id },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        slotOrder: data.slotOrder,
      },
    });

    revalidatePath("/admin/panels/slots");
    return { success: true, slot };
  } catch (error) {
    console.error("Failed to update slot:", error);
    return { error: "Failed to update slot" };
  }
}

export async function deleteSlotAction(id: string) {
  try {
    await checkAdmin();

    // Check if slot has panels assigned
    const slotWithPanels = await prisma.evaluationSlot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { panels: true },
        },
      },
    });

    if (slotWithPanels && slotWithPanels._count.panels > 0) {
      return {
        error: `Cannot delete slot with ${slotWithPanels._count.panels} assigned panels. Please delete or reassign the panels first.`,
      };
    }

    await prisma.evaluationSlot.delete({
      where: { id },
    });

    revalidatePath("/admin/panels/slots");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete slot:", error);
    return { error: "Failed to delete slot" };
  }
}
