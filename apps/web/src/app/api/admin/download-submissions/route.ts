/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@power/db";
import { storageService } from "@power/storage";
import archiver from "archiver";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get all submissions with team data
    const submissions = await prisma.submission.findMany({
      include: {
        team: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: "No submissions found" },
        { status: 404 },
      );
    }

    // Create a zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Create a readable stream from the archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        archive.on("end", () => {
          controller.close();
        });

        archive.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    // Process all submissions
    const downloadPromises = submissions.map(async (submission) => {
      const teamFolder = `team-${submission.team.teamCode}`;

      try {
        // Download document file
        const documentResult = await storageService.get({
          path: submission.documentPath,
        });
        const documentFileName =
          submission.documentPath.split("/").pop() || "document";

        // Convert stream to buffer
        const documentChunks: Buffer[] = [];
        for await (const chunk of documentResult.body) {
          documentChunks.push(
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
          );
        }
        const documentBuffer = Buffer.concat(documentChunks);

        archive.append(documentBuffer, {
          name: `${teamFolder}/${documentFileName}`,
        });

        // Download PPT file
        const pptResult = await storageService.get({
          path: submission.pptPath,
        });
        const pptFileName =
          submission.pptPath.split("/").pop() || "presentation";

        // Convert stream to buffer
        const pptChunks: Buffer[] = [];
        for await (const chunk of pptResult.body) {
          pptChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const pptBuffer = Buffer.concat(pptChunks);

        archive.append(pptBuffer, {
          name: `${teamFolder}/${pptFileName}`,
        });

        // Add a metadata file with submission info
        const metadata = {
          teamName: submission.team.name,
          teamCode: submission.team.teamCode,
          psId: submission.psId,
          submittedAt: submission.submittedAt,
          updatedAt: submission.updatedAt,
          isLocked: submission.isLocked,
          additionalNotes: submission.additionalNotes,
        };

        archive.append(JSON.stringify(metadata, null, 2), {
          name: `${teamFolder}/submission-info.json`,
        });
      } catch (error) {
        console.error(
          `Error downloading files for team ${submission.team.teamCode}:`,
          error,
        );
        // Add error log to archive
        archive.append(
          `Error downloading files: ${error instanceof Error ? error.message : "Unknown error"}`,
          { name: `${teamFolder}/ERROR.txt` },
        );
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    // Finalize the archive
    archive.finalize();

    // Return the zip file as a response
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="all-submissions-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 },
    );
  }
}
