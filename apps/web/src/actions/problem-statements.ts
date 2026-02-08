/** @format */

"use server";

import { prisma } from "@power/db";

/**
 * Get all problem statements
 */
export async function getAllProblemStatements() {
  const problemStatements = await prisma.problemStatement.findMany({
    orderBy: [{ track: "asc" }, { psId: "asc" }],
  });

  return problemStatements;
}

/**
 * Get problem statements by track
 */
export async function getProblemStatementsByTrack(track: string) {
  const problemStatements = await prisma.problemStatement.findMany({
    where: {
      track,
    },
    orderBy: { psId: "asc" },
  });

  return problemStatements;
}

/**
 * Get a single problem statement by psId
 */
export async function getProblemStatementById(psId: string) {
  const problemStatement = await prisma.problemStatement.findUnique({
    where: {
      psId,
    },
  });

  return problemStatement;
}

/**
 * Get all unique tracks
 */
export async function getProblemStatementTracks() {
  const tracks = await prisma.problemStatement.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
    orderBy: {
      track: "asc",
    },
  });

  return tracks.map((t) => t.track);
}
