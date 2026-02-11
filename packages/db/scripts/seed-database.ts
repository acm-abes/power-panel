/** @format */

import { prisma } from "..";
import { RoleName, TeamMemberRole } from "../prisma/generated/prisma/client";

// Faker-like utility functions for generating realistic data
const generateRandomString = (length: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const firstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Arnav",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Shaurya",
  "Atharv",
  "Advik",
  "Pranav",
  "Reyansh",
  "Muhammad",
  "Syed",
  "Aadhya",
  "Saanvi",
  "Kiara",
  "Diya",
  "Pihu",
  "Ananya",
  "Fatima",
  "Aashi",
  "Navya",
  "Angel",
  "Pari",
  "Aadhira",
  "Myra",
  "Sara",
  "Jhanvi",
  "Anika",
  "Riya",
  "Keya",
  "Prisha",
  "Anvi",
  "Sia",
  "Avni",
  "Kashvi",
  "Rohan",
  "Kabir",
  "Yash",
  "Dhruv",
  "Karan",
  "Aryan",
  "Ved",
  "Rudra",
  "Raghav",
  "Laksh",
  "Advait",
  "Shivansh",
  "Aarush",
  "Daksh",
  "Viaan",
  "Arush",
  "Ayush",
  "Reyansh",
  "Parth",
  "Divyansh",
];

const lastNames = [
  "Sharma",
  "Verma",
  "Kumar",
  "Singh",
  "Patel",
  "Gupta",
  "Reddy",
  "Nair",
  "Iyer",
  "Joshi",
  "Desai",
  "Kulkarni",
  "Rao",
  "Menon",
  "Agarwal",
  "Chopra",
  "Khan",
  "Ali",
  "Mehta",
  "Shah",
  "Das",
  "Bose",
  "Banerjee",
  "Chatterjee",
  "Roy",
  "Pillai",
  "Shetty",
  "Kaur",
  "Malhotra",
  "Khanna",
  "Bhat",
  "Pillai",
  "Ghosh",
  "Kapoor",
  "Pandey",
  "Mishra",
  "Jain",
  "Sinha",
  "Saxena",
  "Trivedi",
  "Dwivedi",
  "Bhatt",
  "Tiwari",
  "Yadav",
  "Chauhan",
  "Thakur",
  "Rajput",
  "Varma",
  "Ahuja",
  "Sethi",
];

const colleges = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "IIT Roorkee",
  "BITS Pilani",
  "NIT Trichy",
  "NIT Surathkal",
  "IIIT Hyderabad",
  "DTU Delhi",
  "NSUT Delhi",
  "VIT Vellore",
  "SRM University",
  "Manipal Institute of Technology",
  "PES University",
  "BITS Goa",
  "IIIT Bangalore",
  "RVCE Bangalore",
  "BMS College of Engineering",
  "Jadavpur University",
  "Anna University",
  "Delhi University",
  "Mumbai University",
];

const skills = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "Machine Learning",
  "Deep Learning",
  "TensorFlow",
  "PyTorch",
  "Flutter",
  "React Native",
  "AWS",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "Redis",
  "Blockchain",
  "Solidity",
  "Rust",
  "Go",
  "TypeScript",
  "Next.js",
  "Vue.js",
  "Angular",
];

const generateEmail = (firstName: string, lastName: string, index: number) => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
};

const generatePhoneNumber = () => {
  return `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
};

const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const pickRandomMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateTeamName = (index: number) => {
  const prefixes = [
    "Team",
    "Squad",
    "Crew",
    "Hackers",
    "Innovators",
    "Builders",
    "Coders",
    "Developers",
  ];
  const suffixes = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Omega",
    "Prime",
  ];
  return `${pickRandom(prefixes)} ${pickRandom(suffixes)} ${index}`;
};

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...\n");

  // Delete in order to respect foreign key constraints
  await prisma.evaluationScore.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.evaluationCriterion.deleteMany({});
  await prisma.judgeAssignment.deleteMany({});
  await prisma.mentorFeedback.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  // Note: NOT deleting Analytics or Panel tables as per requirements

  console.log("✓ Database cleared\n");
}

async function seedRoles() {
  console.log("📝 Seeding roles...");

  const roles = [
    { name: RoleName.ADMIN },
    { name: RoleName.JUDGE },
    { name: RoleName.MENTOR },
    { name: RoleName.PARTICIPANT },
  ];

  for (const role of roles) {
    await prisma.role.create({
      data: role,
    });
  }

  console.log(`✓ Created ${roles.length} roles\n`);
}

async function seedUsers() {
  console.log("👥 Seeding users...");

  const userIds: { [key: string]: string[] } = {
    admin: [],
    judge: [],
    mentor: [],
    participant: [],
  };

  // Create 2 admins
  for (let i = 0; i < 2; i++) {
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(lastNames);
    const userId = `admin_${generateRandomString(16)}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, i),
        emailVerified: true,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      },
    });

    userIds.admin.push(userId);
  }

  // Create 35 judges (more than the required 30)
  for (let i = 0; i < 35; i++) {
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(lastNames);
    const userId = `judge_${generateRandomString(16)}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, 100 + i),
        emailVerified: true,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        trackPreferences: {
          AI: Math.floor(Math.random() * 10) + 1,
          Web3: Math.floor(Math.random() * 10) + 1,
          Defense: Math.floor(Math.random() * 10) + 1,
        },
      },
    });

    userIds.judge.push(userId);
  }

  // Create 15 mentors
  for (let i = 0; i < 15; i++) {
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(lastNames);
    const userId = `mentor_${generateRandomString(16)}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, 200 + i),
        emailVerified: true,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      },
    });

    userIds.mentor.push(userId);
  }

  // Create 200 participants (for 50 teams with 3-4 members each)
  for (let i = 0; i < 200; i++) {
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(lastNames);
    const userId = `participant_${generateRandomString(16)}`;

    await prisma.user.create({
      data: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, 300 + i),
        emailVerified: true,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      },
    });

    userIds.participant.push(userId);
  }

  console.log(`✓ Created ${userIds.admin.length} admins`);
  console.log(`✓ Created ${userIds.judge.length} judges`);
  console.log(`✓ Created ${userIds.mentor.length} mentors`);
  console.log(`✓ Created ${userIds.participant.length} participants\n`);

  return userIds;
}

async function seedUserRoles(userIds: { [key: string]: string[] }) {
  console.log("🔑 Assigning roles to users...");

  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map((r) => [r.name, r.id]));

  for (const [roleName, ids] of Object.entries(userIds)) {
    const roleId = roleMap.get(roleName.toUpperCase() as RoleName);
    if (!roleId) continue;

    for (const userId of ids) {
      await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    }
  }

  const totalRoles = Object.values(userIds).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  console.log(`✓ Assigned ${totalRoles} user roles\n`);
}

async function seedProblemStatements() {
  console.log("📋 Seeding problem statements...");

  // Check if problem statements already exist
  const existingPS = await prisma.problemStatement.findMany();

  if (existingPS.length > 0) {
    console.log(`✓ Found ${existingPS.length} existing problem statements\n`);
    return existingPS;
  }

  // Create sample problem statements if none exist
  const problemStatements = [
    {
      psId: "ai-ps-1",
      track: "ai",
      title: "AI-Powered Healthcare Diagnostics",
      provider: "HealthTech Solutions",
      content:
        "<h1>AI-Powered Healthcare Diagnostics</h1><p>Build an AI system for medical diagnosis...</p>",
    },
    {
      psId: "ai-ps-2",
      track: "ai",
      title: "Natural Language Processing for Education",
      provider: "EduTech Innovations",
      content:
        "<h1>Natural Language Processing for Education</h1><p>Create an NLP system for educational content...</p>",
    },
    {
      psId: "defence-ps-1",
      track: "defence",
      title: "Secure Communication System",
      provider: "Defense Research Org",
      content:
        "<h1>Secure Communication System</h1><p>Design a secure communication protocol...</p>",
    },
    {
      psId: "defence-ps-2",
      track: "defence",
      title: "Drone Surveillance Analytics",
      provider: "Defense Tech Labs",
      content:
        "<h1>Drone Surveillance Analytics</h1><p>Build analytics for drone surveillance data...</p>",
    },
    {
      psId: "web3-ps-1",
      track: "web3",
      title: "Decentralized Identity Management",
      provider: "Web3 Foundation",
      content:
        "<h1>Decentralized Identity Management</h1><p>Create a decentralized identity solution...</p>",
    },
    {
      psId: "web3-ps-2",
      track: "web3",
      title: "NFT Marketplace for Digital Art",
      provider: "Crypto Arts Inc",
      content:
        "<h1>NFT Marketplace for Digital Art</h1><p>Build an NFT marketplace platform...</p>",
    },
  ];

  for (const ps of problemStatements) {
    await prisma.problemStatement.create({ data: ps });
  }

  console.log(`✓ Created ${problemStatements.length} problem statements\n`);
  return await prisma.problemStatement.findMany();
}

async function seedTeams(userIds: { [key: string]: string[] }) {
  console.log("👨‍👩‍👧‍👦 Seeding teams...");

  const teams = [];
  let participantIndex = 0;

  for (let i = 0; i < 50; i++) {
    const teamCode = `TEAM-${generateRandomString(8).toUpperCase()}`;
    const teamName = generateTeamName(i + 1);

    const team = await prisma.team.create({
      data: {
        name: teamName,
        teamCode,
      },
    });

    teams.push(team);

    // Add 3-4 members per team
    const teamSize = Math.random() > 0.5 ? 4 : 3;

    for (let j = 0; j < teamSize; j++) {
      if (participantIndex >= userIds.participant.length) break;

      await prisma.teamMember.create({
        data: {
          userId: userIds.participant[participantIndex],
          teamId: team.id,
          role: j === 0 ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
        },
      });

      participantIndex++;
    }
  }

  console.log(`✓ Created ${teams.length} teams with members\n`);
  return teams;
}

async function seedSubmissions(teams: any[], problemStatements: any[]) {
  console.log("📤 Seeding submissions...");

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const ps = pickRandom(problemStatements);

    await prisma.submission.create({
      data: {
        teamId: team.id,
        psId: ps.psId,
        documentPath: `/uploads/documents/${team.teamCode}_document.pdf`,
        documentSize: Math.floor(Math.random() * 5000000 + 1000000), // 1-5 MB
        pptPath: `/uploads/presentations/${team.teamCode}_presentation.pptx`,
        pptSize: Math.floor(Math.random() * 10000000 + 2000000), // 2-10 MB
        additionalNotes:
          Math.random() > 0.5 ? "Please review our innovative approach." : null,
        isLocked: Math.random() > 0.3, // 70% locked
      },
    });
  }

  console.log(`✓ Created ${teams.length} submissions\n`);
}

async function seedEvaluationCriteria() {
  console.log("📊 Seeding evaluation criteria...");

  const criteria = [
    {
      key: "innovation",
      subject: "Innovation",
      description: "Originality and creativity of the solution",
      fullMark: 20,
      order: 1,
    },
    {
      key: "technical",
      subject: "Technical Implementation",
      description: "Quality of code and technical execution",
      fullMark: 25,
      order: 2,
    },
    {
      key: "feasibility",
      subject: "Feasibility",
      description: "Practicality and real-world applicability",
      fullMark: 20,
      order: 3,
    },
    {
      key: "presentation",
      subject: "Presentation",
      description: "Quality of presentation and communication",
      fullMark: 15,
      order: 4,
    },
    {
      key: "impact",
      subject: "Impact",
      description: "Potential impact and scalability",
      fullMark: 20,
      order: 5,
    },
  ];

  for (const criterion of criteria) {
    await prisma.evaluationCriterion.create({ data: criterion });
  }

  console.log(`✓ Created ${criteria.length} evaluation criteria\n`);
  return criteria;
}

async function seedAnnouncements(userIds: { [key: string]: string[] }) {
  console.log("📢 Seeding announcements...");

  const announcements = [
    {
      title: "Welcome to Smart India Hackathon",
      content:
        "Welcome to the Smart India Hackathon 2024! We're excited to have you all here.",
    },
    {
      title: "Submission Deadline Extended",
      content:
        "Due to popular demand, we've extended the submission deadline by 24 hours.",
    },
    {
      title: "Judging Schedule Released",
      content:
        "The judging schedule has been released. Please check your team dashboard for details.",
    },
    {
      title: "Final Results Announcement",
      content:
        "The final results will be announced tomorrow at 5 PM. Stay tuned!",
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: {
        ...announcement,
        createdBy: pickRandom(userIds.admin),
      },
    });
  }

  console.log(`✓ Created ${announcements.length} announcements\n`);
}

async function seedMentorFeedbacks(
  userIds: { [key: string]: string[] },
  teams: any[],
) {
  console.log("💬 Seeding mentor feedbacks...");

  const feedbackTemplates = [
    "Great progress! Keep up the good work on the technical implementation.",
    "Consider adding more test cases to improve reliability.",
    "The UI looks good, but focus more on the backend architecture.",
    "Excellent idea! Make sure to document your approach properly.",
    "Try to optimize the performance of your algorithm.",
  ];

  let count = 0;
  for (let i = 0; i < 25; i++) {
    const team = pickRandom(teams);
    const mentor = pickRandom(userIds.mentor);

    await prisma.mentorFeedback.create({
      data: {
        mentorId: mentor,
        teamId: team.id,
        content: pickRandom(feedbackTemplates),
      },
    });
    count++;
  }

  console.log(`✓ Created ${count} mentor feedbacks\n`);
}

async function seedJudgeAssignments(
  userIds: { [key: string]: string[] },
  teams: any[],
) {
  console.log("⚖️ Seeding judge assignments...");

  let count = 0;

  // Assign 2-3 judges to each team
  for (const team of teams) {
    const numJudges = Math.random() > 0.5 ? 3 : 2;
    const assignedJudges = pickRandomMultiple(userIds.judge, numJudges);

    for (const judgeId of assignedJudges) {
      await prisma.judgeAssignment.create({
        data: {
          judgeId,
          teamId: team.id,
        },
      });
      count++;
    }
  }

  console.log(`✓ Created ${count} judge assignments\n`);
}

async function seedEvaluations(
  userIds: { [key: string]: string[] },
  teams: any[],
  criteria: any[],
) {
  console.log("🎯 Seeding evaluations...");

  let evaluationCount = 0;

  // Create evaluations for some team-judge pairs
  for (let i = 0; i < 30; i++) {
    const team = pickRandom(teams);
    const judge = pickRandom(userIds.judge);

    try {
      const evaluation = await prisma.evaluation.create({
        data: {
          judgeId: judge,
          teamId: team.id,
          submittedAt: Math.random() > 0.3 ? new Date() : null,
          extraPoints: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
          extraJustification:
            Math.random() > 0.8 ? "Exceptional creativity and effort" : null,
        },
      });

      // Add scores for each criterion
      for (const criterion of criteria) {
        await prisma.evaluationScore.create({
          data: {
            evaluationId: evaluation.id,
            criterionId: criterion.id,
            score: Math.floor(Math.random() * criterion.fullMark),
          },
        });
      }

      evaluationCount++;
    } catch (error) {
      // Skip if duplicate (judge-team pair already exists)
      continue;
    }
  }

  console.log(`✓ Created ${evaluationCount} evaluations with scores\n`);
}

async function main() {
  console.log("🚀 Starting database seeding...\n");
  console.log(
    "⚠️  Note: NOT seeding Analytics or Panel tables as per requirements\n",
  );

  try {
    await clearDatabase();

    await seedRoles();
    const userIds = await seedUsers();
    await seedUserRoles(userIds);

    const problemStatements = await seedProblemStatements();
    const teams = await seedTeams(userIds);
    await seedSubmissions(teams, problemStatements);

    const criteria = await seedEvaluationCriteria();
    await seedAnnouncements(userIds);
    await seedMentorFeedbacks(userIds, teams);
    await seedJudgeAssignments(userIds, teams);
    await seedEvaluations(userIds, teams, criteria);

    console.log("✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(
      `   • Users: 252 (2 admins, 35 judges, 15 mentors, 200 participants)`,
    );
    console.log(`   • Teams: 50`);
    console.log(`   • Submissions: 50`);
    console.log(`   • Problem Statements: ${problemStatements.length}`);
    console.log(`   • Evaluation Criteria: ${criteria.length}`);
    console.log(`   • Announcements: 4`);
    console.log(`   • ❌ Panels: 0 (excluded as per requirements)`);
    console.log(`   • ❌ Analytics: 0 (excluded as per requirements)\n`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
