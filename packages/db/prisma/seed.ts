/** @format */

import { EVALUATION_CRITERIA } from "../lib/evaluation-criteria";
import { prisma } from "..";

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

async function seedAdminUser() {
  console.log("Assigning admin role to user...");

  const adminEmail = "kunalranarj2005@gmail.com";

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    console.log(
      `⚠ User with email ${adminEmail} not found. Skipping admin assignment.`,
    );
    return;
  }

  // Find the ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  const participantRole = await prisma.role.findUnique({
    where: { name: "PARTICIPANT" },
  });

  if (!adminRole) {
    console.log(`⚠ ADMIN role not found. Skipping admin assignment.`);
    return;
  }

  if (!participantRole) {
    console.log(`⚠ PARTICIPANT role not found. Skipping admin assignment.`);
    return;
  }

  // Check if user already has admin role
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
  });

  const existingParticipantRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: participantRole.id,
      },
    },
  });

  if (existingUserRole) {
    console.log(`✓ User ${adminEmail} already has ADMIN role`);
    return;
  }

  if (!existingParticipantRole) {
    // Assign participant role if not already assigned
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: participantRole.id,
      },
    });
    console.log(`✓ Assigned PARTICIPANT role to ${adminEmail}`);
  }

  // Assign admin role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✓ Assigned ADMIN role to ${adminEmail}`);
}

async function main() {
  try {
    await seedRoles();
    await seedCriteria();
    await seedAdminUser();
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
