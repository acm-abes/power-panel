/** @format */

"use server";

import { prisma } from "@power/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { enqueueDelete } from "@power/job-runtime/enqueueDelete";

export type SubmissionData = {
  psId: string;
  documentPath: string;
  documentSize: number;
  pptPath: string;
  pptSize: number;
  additionalNotes?: string;
};

/**
 * Create or update a submission for the user's team
 */
export async function createOrUpdateSubmission(data: SubmissionData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Find user's team
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: {
        include: {
          submission: true,
        },
      },
    },
  });

  if (!teamMembership) {
    throw new Error("You are not part of any team");
  }

  const team = teamMembership.team;

  // Check if submission is locked
  if (team.submission?.isLocked) {
    throw new Error("Submission is locked and cannot be modified");
  }

  // If updating and the document path changed, enqueue deletion of old file
  const oldDocumentPath = team.submission?.documentPath;
  const oldPptPath = team.submission?.pptPath;
  const documentChanged =
    oldDocumentPath && oldDocumentPath !== data.documentPath;
  const pptChanged = oldPptPath && oldPptPath !== data.pptPath;

  // Create or update submission
  const submission = await prisma.submission.upsert({
    where: {
      teamId: team.id,
    },
    create: {
      teamId: team.id,
      psId: data.psId,
      documentPath: data.documentPath,
      documentSize: data.documentSize,
      pptPath: data.pptPath,
      pptSize: data.pptSize,
      additionalNotes: data.additionalNotes || null,
    },
    update: {
      psId: data.psId,
      documentPath: data.documentPath,
      documentSize: data.documentSize,
      pptPath: data.pptPath,
      pptSize: data.pptSize,
      additionalNotes: data.additionalNotes || null,
      updatedAt: new Date(),
    },
  });

  // After successful database update, enqueue deletion of old files if they changed
  if (documentChanged && oldDocumentPath) {
    await enqueueDelete({
      path: oldDocumentPath,
      reason: "Submission updated with new document",
    });
  }

  if (pptChanged && oldPptPath) {
    await enqueueDelete({
      path: oldPptPath,
      reason: "Submission updated with new PPT",
    });
  }

  revalidatePath("/teams/my-team");
  revalidatePath("/admin/submissions");

  return submission;
}

/**
 * Delete a submission for the user's team
 */
export async function deleteSubmission() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Find user's team
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: {
        include: {
          submission: true,
        },
      },
    },
  });

  if (!teamMembership) {
    throw new Error("You are not part of any team");
  }

  const team = teamMembership.team;

  if (!team.submission) {
    throw new Error("No submission found");
  }

  // Check if submission is locked
  if (team.submission.isLocked) {
    throw new Error("Submission is locked and cannot be deleted");
  }

  // Store the file paths before deletion
  const documentPath = team.submission.documentPath;
  const pptPath = team.submission.pptPath;

  // Delete from database
  await prisma.submission.delete({
    where: {
      id: team.submission.id,
    },
  });

  // Enqueue job to delete document file from S3
  await enqueueDelete({
    path: documentPath,
    reason: "Submission deleted by team",
  });

  // Enqueue job to delete PPT file from S3
  await enqueueDelete({
    path: pptPath,
    reason: "Submission deleted by team",
  });

  revalidatePath("/teams/my-team");
  revalidatePath("/admin/submissions");

  return { success: true };
}

/**
 * Get all submissions (admin only)
 */
export async function getAllSubmissions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      role: true,
    },
  });

  const isAdmin = userRoles.some((ur) => ur.role.name === "ADMIN");

  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  const submissions = await prisma.submission.findMany({
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return submissions;
}

/**
 * Lock/unlock a submission (admin only)
 */
export async function toggleSubmissionLock(submissionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      role: true,
    },
  });

  const isAdmin = userRoles.some((ur) => ur.role.name === "ADMIN");

  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  const updated = await prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      isLocked: !submission.isLocked,
    },
  });

  revalidatePath("/admin/submissions");

  return updated;
}
