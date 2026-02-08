/** @format */

"use server";

import { prisma } from "@power/db";
import { unstable_cache } from "next/cache";

/**
 * Get all problem statements with caching
 * Cached for 1 hour to reduce database load
 */
export const getAllProblemStatementsCached = unstable_cache(
  async () => {
    const problemStatements = await prisma.problemStatement.findMany({
      select: {
        id: true,
        psId: true,
        track: true,
        title: true,
        provider: true,
        content: true,
      },
      orderBy: [{ track: "asc" }, { psId: "asc" }],
    });

    return problemStatements;
  },
  ["problem-statements-all"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["problem-statements"],
  },
);

/**
 * Get problem statements by track with caching
 */
export const getProblemStatementsByTrackCached = unstable_cache(
  async (track: string) => {
    const problemStatements = await prisma.problemStatement.findMany({
      where: {
        track,
      },
      select: {
        id: true,
        psId: true,
        track: true,
        title: true,
        provider: true,
        content: true,
      },
      orderBy: { psId: "asc" },
    });

    return problemStatements;
  },
  ["problem-statements-by-track"],
  {
    revalidate: 3600,
    tags: ["problem-statements"],
  },
);

/**
 * Get a single problem statement by psId with caching
 */
export const getProblemStatementByIdCached = unstable_cache(
  async (psId: string) => {
    const problemStatement = await prisma.problemStatement.findUnique({
      where: {
        psId,
      },
      select: {
        id: true,
        psId: true,
        track: true,
        title: true,
        provider: true,
        content: true,
      },
    });

    return problemStatement;
  },
  ["problem-statement-by-id"],
  {
    revalidate: 3600,
    tags: ["problem-statements"],
  },
);
