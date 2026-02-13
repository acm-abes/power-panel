/** @format */

"use server";

import { prisma } from "@power/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";

const createPanelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

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

export async function createPanel(formData: FormData) {
  try {
    await checkAdmin();
  } catch (error) {
    return { error: "Unauthorized" };
  }

  const parsed = createPanelSchema.safeParse({
    name: formData.get("name"),
    capacity: formData.get("capacity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.panel.create({
      data: {
        name: parsed.data.name,
        capacity: parsed.data.capacity,
      },
    });
    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to create panel:", error);
    return { error: "Failed to create panel" };
  }
}

export async function deletePanel(id: string) {
  try {
    await checkAdmin();
  } catch (error) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.panel.delete({
      where: { id },
    });
    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete panel:", error);
    return { error: "Failed to delete panel" };
  }
}

export async function getPanels() {
  try {
    await checkAdmin();
  } catch (error) {
    // Return empty array if not authorized (or handle differently)
    return [];
  }

  try {
    return await prisma.panel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { judges: true, submissions: true },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch panels:", error);
    return [];
  }
}
