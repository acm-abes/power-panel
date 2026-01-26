/** @format */

import { prisma } from "../src/lib/prisma";
import { EVALUATION_CRITERIA } from "../src/lib/evaluation-criteria";

async function seedCriteria() {
  console.log("Seeding evaluation criteria...");

  for (const criterion of EVALUATION_CRITERIA) {
    await prisma.evaluationCriterion.upsert({
      where: { key: criterion.key },
      update: {
        subject: criterion.subject,
        description: criterion.description,
        fullMark: criterion.fullMark,
        order: criterion.order,
        isActive: true,
      },
      create: {
        key: criterion.key,
        subject: criterion.subject,
        description: criterion.description,
        fullMark: criterion.fullMark,
        order: criterion.order,
        isActive: true,
      },
    });
    console.log(`✓ Seeded criterion: ${criterion.subject}`);
  }

  console.log("✓ Criteria seeding complete!");
}

async function seedRoles() {
  console.log("Seeding system roles...");

  const roles = ["ADMIN", "JUDGE", "MENTOR", "PARTICIPANT"] as const;

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    console.log(`✓ Seeded role: ${roleName}`);
  }

  console.log("✓ Roles seeding complete!");
}

async function main() {
  try {
    await seedRoles();
    await seedCriteria();
    console.log("\n🎉 Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
