/** @format */

import { prisma, RoleName } from "@power/db";
import * as fs from "fs";
import * as path from "path";

interface JudgeData {
  name: string;
  slots: string[];
  domain?: string;
}

interface SlotInfo {
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  slotOrder: number;
  date: string;
}

// Define the 4 evaluation slots
const EVALUATION_SLOTS: SlotInfo[] = [
  {
    name: "Day 1 - Morning",
    day: 1,
    startTime: "11:00 AM",
    endTime: "01:00 PM",
    slotOrder: 1,
    date: "14-02-2026",
  },
  {
    name: "Day 1 - Afternoon",
    day: 1,
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    slotOrder: 2,
    date: "14-02-2026",
  },
  {
    name: "Day 2 - Morning",
    day: 2,
    startTime: "11:00 AM",
    endTime: "01:00 PM",
    slotOrder: 1,
    date: "15-02-2026",
  },
  {
    name: "Day 2 - Afternoon",
    day: 2,
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    slotOrder: 2,
    date: "15-02-2026",
  },
];

// Parse CSV file and extract judge names
function parseJudgesFromCSV(
  filePath: string,
  slotKey: string,
): Map<string, JudgeData> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  const judgesMap = new Map<string, JudgeData>();

  // Skip the header line (first line with date and time)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Split by tab
    const parts = line.split("\t").map((p) => p.trim());

    // Look for judge names (typically in position index 2)
    if (parts.length >= 3) {
      let judgeName = parts[2];
      let domain: string | undefined;

      // Extract domain if present (e.g., "Afzal\tweb 3" or "Samyak Jain\tAI+ Defense")
      if (parts.length >= 4 && parts[3]) {
        domain = parts[3];
      }

      // Clean up the judge name
      judgeName = judgeName.trim();

      // Skip empty names or panel labels
      if (!judgeName || judgeName.toLowerCase().includes("panel")) {
        continue;
      }

      if (judgesMap.has(judgeName)) {
        // Judge already exists, add this slot
        const existing = judgesMap.get(judgeName)!;
        if (!existing.slots.includes(slotKey)) {
          existing.slots.push(slotKey);
        }
        // Update domain if provided and not already set
        if (domain && !existing.domain) {
          existing.domain = domain;
        }
      } else {
        // New judge
        judgesMap.set(judgeName, {
          name: judgeName,
          slots: [slotKey],
          domain: domain,
        });
      }
    }
  }

  return judgesMap;
}

// Generate email from name
function generateEmail(name: string): string {
  // Remove special characters and convert to lowercase
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");

  return `${cleaned}@judge.sah.acm.org`;
}

// Generate a unique ID for user
function generateUserId(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return `judge_${cleaned}_${Date.now()}`;
}

async function main() {
  console.log("🚀 Starting judges seed script...\n");

  // 1. Parse all CSV files
  console.log("📄 Parsing CSV files...");
  const dataDir = path.join(__dirname, "..", "data");

  const allJudges = new Map<string, JudgeData>();

  const files = [
    { file: "judges/p1.csv", slot: "slot_1_1" }, // Day 1, Slot 1
    { file: "judges/p2.csv", slot: "slot_1_2" }, // Day 1, Slot 2
    { file: "judges/p3.csv", slot: "slot_2_1" }, // Day 2, Slot 1
    { file: "judges/p4.csv", slot: "slot_2_2" }, // Day 2, Slot 2
  ];

  for (const { file, slot } of files) {
    const filePath = path.join(dataDir, file);
    console.log(`  - Parsing ${file} (${slot})...`);

    const judges = parseJudgesFromCSV(filePath, slot);

    // Merge into allJudges
    judges.forEach((judgeData, name) => {
      if (allJudges.has(name)) {
        const existing = allJudges.get(name)!;
        judgeData.slots.forEach((s) => {
          if (!existing.slots.includes(s)) {
            existing.slots.push(s);
          }
        });
        if (judgeData.domain && !existing.domain) {
          existing.domain = judgeData.domain;
        }
      } else {
        allJudges.set(name, judgeData);
      }
    });
  }

  console.log(`✅ Found ${allJudges.size} unique judges\n`);

  // 2. Ensure JUDGE role exists
  console.log("👮 Ensuring JUDGE role exists...");
  const judgeRole = await prisma.role.upsert({
    where: { name: RoleName.JUDGE },
    update: {},
    create: { name: RoleName.JUDGE },
  });
  console.log(`✅ JUDGE role ready (ID: ${judgeRole.id})\n`);

  // 3. Create or update evaluation slots
  console.log("⏰ Creating evaluation slots...");
  const slotIdMap = new Map<string, string>();

  for (const slotInfo of EVALUATION_SLOTS) {
    const slot = await prisma.evaluationSlot.upsert({
      where: {
        day_slotOrder: {
          day: slotInfo.day,
          slotOrder: slotInfo.slotOrder,
        },
      },
      update: {
        name: slotInfo.name,
        startTime: slotInfo.startTime,
        endTime: slotInfo.endTime,
      },
      create: {
        name: slotInfo.name,
        day: slotInfo.day,
        startTime: slotInfo.startTime,
        endTime: slotInfo.endTime,
        slotOrder: slotInfo.slotOrder,
      },
    });

    const slotKey = `slot_${slotInfo.day}_${slotInfo.slotOrder}`;
    slotIdMap.set(slotKey, slot.id);
    console.log(
      `  ✅ ${slotInfo.name} (${slotInfo.date} ${slotInfo.startTime} - ${slotInfo.endTime})`,
    );
  }
  console.log();

  // 4. Create users and assign roles
  console.log("👤 Creating judge users...");
  let createdCount = 0;
  let skippedCount = 0;

  const userIdMap = new Map<string, string>();

  for (const [judeName, judgeData] of allJudges) {
    const email = generateEmail(judeName);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`  ⏭️  Skipping ${judeName} (${email}) - already exists`);
      userIdMap.set(judeName, existingUser.id);
      skippedCount++;
    } else {
      const userId = generateUserId(judeName);

      // Create user
      const user = await prisma.user.create({
        data: {
          id: userId,
          name: judeName,
          email: email,
          emailVerified: true,
          trackPreferences: judgeData.domain
            ? { domain: judgeData.domain }
            : undefined,
        },
      });

      // Assign JUDGE role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: judgeRole.id,
        },
      });

      userIdMap.set(judeName, user.id);
      createdCount++;
      console.log(`  ✅ Created ${judeName} (${email})`);
    }
  }

  console.log(`\n📊 Users: ${createdCount} created, ${skippedCount} skipped\n`);

  // 5. Create judge availabilities
  console.log("📅 Creating judge availabilities...");
  let availabilityCount = 0;

  for (const [judgeName, judgeData] of allJudges) {
    const userId = userIdMap.get(judgeName);
    if (!userId) continue;

    for (const slotKey of judgeData.slots) {
      const slotId = slotIdMap.get(slotKey);
      if (!slotId) continue;

      // Check if availability already exists
      const existing = await prisma.judgeAvailability.findUnique({
        where: {
          judgeId_slotId: {
            judgeId: userId,
            slotId: slotId,
          },
        },
      });

      if (!existing) {
        await prisma.judgeAvailability.create({
          data: {
            judgeId: userId,
            slotId: slotId,
          },
        });
        availabilityCount++;
      }
    }
  }

  console.log(`✅ Created ${availabilityCount} availability records\n`);

  // 6. Summary
  console.log("📈 Summary:");
  console.log(`  - Total unique judges: ${allJudges.size}`);
  console.log(`  - Users created: ${createdCount}`);
  console.log(`  - Users skipped: ${skippedCount}`);
  console.log(`  - Evaluation slots: ${EVALUATION_SLOTS.length}`);
  console.log(`  - Availability records: ${availabilityCount}`);
  console.log("\n✨ Judges seed completed successfully!");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
