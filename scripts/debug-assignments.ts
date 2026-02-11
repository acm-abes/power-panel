/** @format */

import { prisma } from "@power/db";

async function debugAssignments() {
  console.log("🔍 Checking submissions...");

  // Check total submissions
  const totalSubmissions = await prisma.submission.count();
  console.log("Total submissions:", totalSubmissions);

  // Check submissions with panelId null
  const unassignedCount = await prisma.submission.count({
    where: { panelId: null },
  });
  console.log("Unassigned submissions (panelId: null):", unassignedCount);

  // Check submissions with panelId
  const assignedCount = await prisma.submission.count({
    where: { panelId: { not: null } },
  });
  console.log("Assigned submissions (panelId: not null):", assignedCount);

  // Fetch a few unassigned submissions
  const unassignedSubmissions = await prisma.submission.findMany({
    where: { panelId: null },
    take: 5,
    select: {
      id: true,
      psId: true,
      panelId: true,
      problemStatement: {
        select: { track: true },
      },
    },
  });

  console.log("\nFirst 5 unassigned submissions:");
  console.log(JSON.stringify(unassignedSubmissions, null, 2));

  // Check panels
  console.log("\n🔍 Checking panels...");
  const totalPanels = await prisma.panel.count();
  console.log("Total panels:", totalPanels);

  const panels = await prisma.panel.findMany({
    include: {
      judges: {
        include: {
          user: {
            select: { id: true, name: true, trackPreferences: true },
          },
        },
      },
      _count: { select: { submissions: true } },
    },
  });

  console.log("\nPanel details:");
  panels.forEach((p) => {
    console.log(`Panel ${p.id}:`, {
      name: p.name,
      capacity: p.capacity,
      currentSubmissions: p._count.submissions,
      judges: p.judges.length,
      isLocked: p.isLocked,
    });
  });

  await prisma.$disconnect();
}

debugAssignments().catch(console.error);
