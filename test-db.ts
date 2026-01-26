/** @format */

import { prisma } from "./src/lib/prisma";

async function test() {
  try {
    console.log("Testing connection...");
    const users = await prisma.user.findMany();
    console.log("✓ Connected! Users:", users.length);

    const roles = await prisma.role.findMany();
    console.log("✓ Roles table exists! Roles:", roles.length);

    const criteria = await prisma.evaluationCriterion.findMany();
    console.log("✓ Criteria table exists! Criteria:", criteria.length);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
