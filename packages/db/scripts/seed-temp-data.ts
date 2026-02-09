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

    // Fetch all existing data upfront
    console.log("📥 Fetching existing data...");
    const [existingTeams, existingMembers, existingAnalytics] =
      await Promise.all([
        prisma.tempTeamData.findMany({
          select: { id: true, teamCode: true },
        }),
        prisma.tempTeamMembers.findMany({
          select: { userEmail: true, teamId: true },
        }),
        prisma.analytics.findMany({
          select: { serialNo: true },
        }),
      ]);

    // Create lookup maps
    const teamCodeToId = new Map(existingTeams.map((t) => [t.teamCode, t.id]));
    const existingMemberEmails = new Set(
      existingMembers.map((m) => `${m.teamId}:${m.userEmail.toLowerCase()}`),
    );
    const existingSerialNos = new Set(existingAnalytics.map((a) => a.serialNo));

    // Prepare bulk inserts
    const teamsToCreate: { name: string; teamCode: string }[] = [];
    const membersToCreate: { userEmail: string; teamId: string }[] = [];
    const analyticsToCreate: any[] = [];

    let teamsCreated = 0;
    let teamsUpdated = 0;
    let membersCreated = 0;
    let membersSkipped = 0;

    // Identify new teams
    for (const [teamCode, members] of teamMap) {
      if (!teamCodeToId.has(teamCode)) {
        teamsToCreate.push({
          name: members[0]["Team Name"],
          teamCode: teamCode,
        });
      }
    }

    // Bulk create teams
    if (teamsToCreate.length > 0) {
      console.log(`➕ Creating ${teamsToCreate.length} new teams...`);
      await prisma.tempTeamData.createMany({
        data: teamsToCreate,
        skipDuplicates: true,
      });
      teamsCreated = teamsToCreate.length;

      // Fetch newly created teams
      const newTeams = await prisma.tempTeamData.findMany({
        where: {
          teamCode: { in: teamsToCreate.map((t) => t.teamCode) },
        },
        select: { id: true, teamCode: true },
      });

      // Update lookup map
      for (const team of newTeams) {
        teamCodeToId.set(team.teamCode, team.id);
      }
    }

    teamsUpdated = teamMap.size - teamsCreated;

    // Prepare members and analytics for bulk insert
    console.log("🔍 Preparing members and analytics data...");
    for (const [teamCode, members] of teamMap) {
      const teamId = teamCodeToId.get(teamCode)!;

      for (const member of members) {
        const memberEmail = member["User Email"].toLowerCase();
        const memberKey = `${teamId}:${memberEmail}`;

        // Check if member needs to be created
        if (!existingMemberEmails.has(memberKey)) {
          membersToCreate.push({
            userEmail: member["User Email"],
            teamId: teamId,
          });
          membersCreated++;
        } else {
          membersSkipped++;
        }

        // Check if analytics record needs to be created
        if (!existingSerialNos.has(member["Serial No."])) {
          analyticsToCreate.push({
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
          });
        }
      }
    }

    // Bulk insert members and analytics
    console.log("💾 Bulk inserting data...");
    const bulkInsertPromises = [];

    if (membersToCreate.length > 0) {
      console.log(`➕ Creating ${membersToCreate.length} new members...`);
      bulkInsertPromises.push(
        prisma.tempTeamMembers.createMany({
          data: membersToCreate,
          skipDuplicates: true,
        }),
      );
    }

    if (analyticsToCreate.length > 0) {
      console.log(
        `➕ Creating ${analyticsToCreate.length} new analytics records...`,
      );
      bulkInsertPromises.push(
        prisma.analytics.createMany({
          data: analyticsToCreate,
          skipDuplicates: true,
        }),
      );
    }

    // Execute bulk inserts in parallel
    if (bulkInsertPromises.length > 0) {
      await Promise.all(bulkInsertPromises);
    }

    console.log(`✅ Successfully seeded:`);
    console.log(`   - ${teamsCreated} teams created`);
    console.log(`   - ${teamsUpdated} teams already existed`);
    console.log(`   - ${membersCreated} new members added`);
    console.log(`   - ${membersSkipped} members already existed`);
    console.log(`   - ${analyticsToCreate.length} analytics records created`);
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
