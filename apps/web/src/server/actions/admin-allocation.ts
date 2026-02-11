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

export async function assignJudgeToPanel(judgeId: string, panelId: string) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    // Remove from other panels first? Logic says "Each judge belongs to exactly one panel"
    // So we should delete existing assignments for this judge
    await prisma.panelJudge.deleteMany({
      where: { userId: judgeId },
    });

    await prisma.panelJudge.create({
      data: {
        panelId,
        userId: judgeId,
      },
    });

    revalidatePath("/admin/panels/[id]"); // Assuming dynamic route
    return { success: true };
  } catch (error) {
    console.error("Failed to assign judge:", error);
    return { error: "Failed to assign judge" };
  }
}

export async function removeJudgeFromPanel(judgeId: string, panelId: string) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.panelJudge.deleteMany({
      where: {
        panelId,
        userId: judgeId,
      },
    });
    revalidatePath("/admin/panels/[id]");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove judge:", error);
    return { error: "Failed to remove judge" };
  }
}

export async function assignSubmissionToPanel(
  submissionId: string,
  panelId: string,
) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { panelId },
    });
    revalidatePath("/admin/panels/[id]");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign submission:", error);
    return { error: "Failed to assign submission" };
  }
}

export async function lockPanel(panelId: string, isLocked: boolean) {
  try {
    await checkAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.panel.update({
      where: { id: panelId },
      data: { isLocked },
    });
    revalidatePath("/admin/panels");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle lock:", error);
    return { error: "Failed to toggle lock" };
  }
}
