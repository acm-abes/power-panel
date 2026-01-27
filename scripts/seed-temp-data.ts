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
    const file = Bun.file("data/sah-20_registrations.csv");
    const csvContent = await file.text();

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRow[];

    console.log(`📊 Found ${records.length} records in CSV`);

    // Clear existing temp data
    console.log("🗑️  Clearing existing temp data...");
    await prisma.tempTeamMembers.deleteMany();
    await prisma.tempTeamData.deleteMany();

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

    // Create teams and members
    let teamCount = 0;
    let memberCount = 0;

    for (const [teamName, members] of teamMap) {
      // Create team
      const team = await prisma.tempTeamData.create({
        data: {
          name: teamName,
          track: null, // Track info not in CSV
        },
      });

      teamCount++;

      // Create team members
      for (const member of members) {
        await prisma.tempTeamMembers.create({
          data: {
            userEmail: member["User Email"],
            teamId: team.id,
          },
        });

        memberCount++;
      }
    }

    console.log(`✅ Successfully seeded:`);
    console.log(`   - ${teamCount} teams`);
    console.log(`   - ${memberCount} team members`);
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
