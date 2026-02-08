/** @format */

"use server";

import { enqueueUpload } from "@power/job-runtime/enqueueUpload";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@power/db";

export async function uploadSubmissionFile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Get user's team
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMemberships: {
        include: { team: true },
      },
    },
  });

  const team = user?.teamMemberships[0]?.team;
  if (!team) {
    throw new Error("You must be part of a team to submit");
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create storage path: submissions/team-{teamId}/{timestamp}-{filename}
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `submissions/team-${team.id}/${timestamp}-${sanitizedFileName}`;

  // Enqueue upload job for background processing
  await enqueueUpload({
    filePath: file.name, // Original filename for reference
    destinationPath: storagePath,
    body: buffer,
    contentType: file.type,
  });

  // Return immediately with the expected path and size
  // The actual upload will happen in the background via the worker
  return {
    path: storagePath,
    size: buffer.length,
    originalName: file.name,
  };
}
