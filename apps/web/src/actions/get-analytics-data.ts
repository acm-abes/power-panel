/** @format */

"use server";

import { prisma } from "@power/db";

export async function getAnalyticsData() {
  // Get valid team codes from TempTeamData (source of truth)
  const validTeams = await prisma.tempTeamData.findMany({
    select: { teamCode: true },
  });
  const validTeamCodes = new Set(validTeams.map((t) => t.teamCode));

  // Only get analytics for teams that currently exist
  const analytics = await prisma.analytics.findMany({
    where: {
      teamCode: {
        in: Array.from(validTeamCodes),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = analytics.length;

  // Team statistics
  const uniqueTeams = new Set(analytics.map((d) => d.teamCode)).size;
  const teamsSubmitted = new Set(
    analytics
      .filter((d) => d.submitted.toLowerCase() === "yes")
      .map((d) => d.teamCode),
  ).size;

  // Position distribution
  const positions = analytics.reduce(
    (acc, d) => {
      acc[d.position] = (acc[d.position] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Education statistics
  const educationLevels = analytics.reduce(
    (acc, d) => {
      acc[d.educationLevel] = (acc[d.educationLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const degreeTypes = analytics.reduce(
    (acc, d) => {
      acc[d.degreeType] = (acc[d.degreeType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const graduationYears = analytics.reduce(
    (acc, d) => {
      acc[d.graduationYear] = (acc[d.graduationYear] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Top colleges
  const colleges = analytics.reduce(
    (acc, d) => {
      let college = d.collegeName.trim();
      // Normalize ABES variants to "ABES EC"
      if (college.toUpperCase().includes("ABES")) {
        college = "ABES EC";
      }
      acc[college] = (acc[college] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topColleges = Object.entries(colleges).sort(([, a], [, b]) => b - a);

  // Hackathon experience
  const hackathonExp = analytics.reduce(
    (acc, d) => {
      const exp = d.hackathonExperience || "not_specified";
      acc[exp] = (acc[exp] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Interested roles
  const interestedRoles = analytics.reduce(
    (acc, d) => {
      const role = d.interestedRoles || "not_specified";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // T-shirt sizes
  const tshirtSizes = analytics.reduce(
    (acc, d) => {
      const size = d.tshirtSize?.toUpperCase() || "not_specified";
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Dietary restrictions
  const dietaryRestrictions = analytics.reduce(
    (acc, d) => {
      const restriction = d.dietaryRestrictions || "none";
      acc[restriction] = (acc[restriction] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Users with GitHub
  const usersWithGithub = analytics.filter(
    (d) => d.githubUsername && d.githubUsername !== "-",
  ).length;

  // Users with Portfolio
  const usersWithPortfolio = analytics.filter(
    (d) => d.portfolioUrl && d.portfolioUrl !== "-",
  ).length;

  // Team size distribution
  const teamSizes = analytics.reduce(
    (acc, d) => {
      acc[d.teamCode] = (acc[d.teamCode] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const teamSizeDistribution = Object.values(teamSizes).reduce(
    (acc, size) => {
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Average team size
  const avgTeamSize = total / uniqueTeams;

  return {
    total,
    uniqueTeams,
    teamsSubmitted,
    positions,
    educationLevels,
    degreeTypes,
    graduationYears,
    topColleges,
    hackathonExp,
    interestedRoles,
    tshirtSizes,
    dietaryRestrictions,
    usersWithGithub,
    usersWithPortfolio,
    teamSizeDistribution,
    avgTeamSize,
  };
}

export type AnalyticsStats = Awaited<ReturnType<typeof getAnalyticsData>>;
