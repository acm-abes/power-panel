/** @format */

import { prisma } from "..";
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

    // Group records by team code (unique identifier)
    const teamMap = new Map<string, CSVRow[]>();
    for (const record of records) {
      const teamCode = record["Team Code"];
      if (!teamMap.has(teamCode)) {
        teamMap.set(teamCode, []);
      }
      teamMap.get(teamCode)!.push(record);
    }

    console.log(`👥 Found ${teamMap.size} unique teams`);

    // Create/update teams and members
    let teamsCreated = 0;
    let teamsUpdated = 0;
    let membersCreated = 0;
    let membersSkipped = 0;
    let analyticsCreated = 0;

    for (const [teamCode, members] of teamMap) {
      // Get team name from first member
      const teamName = members[0]["Team Name"];

      // Find or create team by teamCode (unique identifier)
      let team = await prisma.tempTeamData.findUnique({
        where: { teamCode },
      });

      if (!team) {
        team = await prisma.tempTeamData.create({
          data: {
            name: teamName,
            teamCode: teamCode,
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

      // Create only new team members and analytics records
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

        // Insert analytics data (for all members, even if already in temp table)
        const existingAnalytics = await prisma.analytics.findUnique({
          where: { serialNo: member["Serial No."] },
        });

        if (!existingAnalytics) {
          await prisma.analytics.create({
            data: {
              serialNo: member["Serial No."],
              teamName: member["Team Name"],
              teamCode: member["Team Code"],
              userName: member["User Name"],
              userEmail: member["User Email"],
              position: member["Position"],
              status: member["Status"],
              submitted: member["Submitted"],
              joinedAt: member["Joined At"],
              firstName: member["First Name"],
              lastName: member["Last Name"],
              phoneNumber: member["Phone Number"],
              degreeType: member["Degree Type"],
              educationLevel: member["Education Level"],
              graduationYear: member["Graduation Year"],
              collegeName: member["College Name"],
              skills: member["Skills"] || null,
              githubUsername: member["GitHub Username"] || null,
              portfolioUrl: member["Portfolio URL"] || null,
              bio: member["Bio"] || null,
              hackathonExperience: member["Hackathon Experience"] || null,
              interestedRoles: member["Interested Roles"] || null,
              dietaryRestrictions: member["Dietary Restrictions"] || null,
              tshirtSize: member["T-Shirt Size"] || null,
            },
          });
          analyticsCreated++;
        }
      }
    }

    console.log(`✅ Successfully seeded:`);
    console.log(`   - ${teamsCreated} teams created`);
    console.log(`   - ${teamsUpdated} teams already existed`);
    console.log(`   - ${membersCreated} new members added`);
    console.log(`   - ${membersSkipped} members already existed`);
    console.log(`   - ${analyticsCreated} analytics records created`);
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
