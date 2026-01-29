/** @format */

import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

interface CSVRow {
  "Serial No.": string;
  "Team Name": string;
  "Team Code": string;
  "User Name": string;
  "User Email": string;
  Position: string;
  Status: string;
  Submitted: string;
  "Joined At": string;
  "First Name": string;
  "Last Name": string;
  "Phone Number": string;
  "Degree Type": string;
  "Education Level": string;
  "Graduation Year": string;
  "College Name": string;
  Skills: string;
  "GitHub Username": string;
  "Portfolio URL": string;
  Bio: string;
  "Hackathon Experience": string;
  "Interested Roles": string;
  "Dietary Restrictions": string;
  "T-Shirt Size": string;
}

async function seedTempData() {
  console.log("🌱 Starting temp data seeding...");

  try {
    // Read CSV file using Bun's native file API
    const file = Bun.file("data/sah_20.csv");
    const csvContent = await file.text();

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRow[];

    console.log(`📊 Found ${records.length} records in CSV`);

    // Group records by team
    const teamMap = new Map<string, CSVRow[]>();
    for (const record of records) {
      const teamName = record["Team Name"];
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, []);
      }
      teamMap.get(teamName)!.push(record);
    }

    console.log(`👥 Found ${teamMap.size} unique teams`);

    // Create/update teams and members
    let teamsCreated = 0;
    let teamsUpdated = 0;
    let membersCreated = 0;
    let membersSkipped = 0;

    for (const [teamName, members] of teamMap) {
      // Find or create team
      let team = await prisma.tempTeamData.findFirst({
        where: { name: teamName },
      });

      if (!team) {
        team = await prisma.tempTeamData.create({
          data: {
            name: teamName,
            track: null, // Track info not in CSV
          },
        });
        teamsCreated++;
      } else {
        teamsUpdated++;
      }

      // Get existing members for this team
      const existingMembers = await prisma.tempTeamMembers.findMany({
        where: { teamId: team.id },
        select: { userEmail: true },
      });

      const existingEmails = new Set(
        existingMembers.map((m) => m.userEmail.toLowerCase()),
      );

      // Create only new team members
      for (const member of members) {
        const memberEmail = member["User Email"].toLowerCase();

        if (!existingEmails.has(memberEmail)) {
          await prisma.tempTeamMembers.create({
            data: {
              userEmail: member["User Email"],
              teamId: team.id,
            },
          });
          membersCreated++;
        } else {
          membersSkipped++;
        }
      }
    }

    console.log(`✅ Successfully seeded:`);
    console.log(`   - ${teamsCreated} teams created`);
    console.log(`   - ${teamsUpdated} teams already existed`);
    console.log(`   - ${membersCreated} new members added`);
    console.log(`   - ${membersSkipped} members already existed`);
  } catch (error) {
    console.error("❌ Error seeding temp data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTempData()
  .then(() => {
    console.log("🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
