/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@power/db";
import { enqueueUpload } from "@power/job-runtime/enqueueUpload";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "You must be part of a team to upload files" },
        { status: 403 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the maximum limit of 50MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 },
      );
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

    // Return the storage path and file details
    // The actual upload will happen in the background via the worker
    return NextResponse.json({
      path: storagePath,
      size: buffer.length,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
