/** @format */

import * as fs from "fs";
import * as path from "path";
import { prisma } from "..";

interface ProblemStatementData {
  psId: string;
  track: string;
  title: string;
  provider: string;
  content: string;
}

// Extract HTML content from React component
function extractHtmlFromTsx(filePath: string): {
  html: string;
  title: string;
  provider: string;
} | null {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Extract the return statement content
  const returnMatch = fileContent.match(/return\s*\(([\s\S]*?)\);\s*\}/);
  if (!returnMatch) {
    console.error(`Could not find return statement in ${filePath}`);
    return null;
  }

  let jsxContent = returnMatch[1].trim();

  // Extract title from h1 tag
  const titleMatch = jsxContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
    : "Untitled";

  // Extract provider
  const providerMatch = jsxContent.match(/<span[^>]*>from<\/span>\s*([^<]+)/);
  const provider = providerMatch ? providerMatch[1].trim() : "Unknown";

  // Convert JSX to HTML
  let html = jsxContent
    // Convert className to class
    .replace(/className=/g, "class=")
    // Handle escaped quotes like &quot;
    .replace(/&quot;/g, '"')
    // Remove any comments
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  return {
    html,
    title,
    provider,
  };
}

// Get all problem statement files
function getProblemStatementFiles(): ProblemStatementData[] {
  const psDataDir = path.join(__dirname, "../data/problem-statements");
  const tracks = ["ai", "defence", "web3"];
  const problemStatements: ProblemStatementData[] = [];

  for (const track of tracks) {
    const trackDir = path.join(psDataDir, track);

    if (!fs.existsSync(trackDir)) {
      console.warn(`Track directory not found: ${trackDir}`);
      continue;
    }

    const entries = fs.readdirSync(trackDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("ps-")) {
        const psDir = path.join(trackDir, entry.name);
        const pagePath = path.join(psDir, "page.tsx");

        if (fs.existsSync(pagePath)) {
          const psNumber = entry.name.replace("ps-", "");
          const psId = `${track}-ps-${psNumber}`;

          const extracted = extractHtmlFromTsx(pagePath);
          if (extracted) {
            problemStatements.push({
              psId,
              track,
              title: extracted.title,
              provider: extracted.provider,
              content: extracted.html,
            });
            console.log(`✓ Extracted: ${psId} - ${extracted.title}`);
          }
        }
      }
    }
  }

  return problemStatements;
}

async function seedProblemStatements() {
  console.log("Starting problem statement seeding...\n");

  try {
    // Get all problem statements from files
    const problemStatements = getProblemStatementFiles();

    if (problemStatements.length === 0) {
      console.error("No problem statements found!");
      return;
    }

    console.log(`\nFound ${problemStatements.length} problem statements\n`);

    // Delete existing problem statements
    console.log("Clearing existing problem statements...");
    await prisma.problemStatement.deleteMany({});

    // Insert new problem statements
    console.log("Inserting problem statements...\n");
    for (const ps of problemStatements) {
      await prisma.problemStatement.create({
        data: {
          psId: ps.psId,
          track: ps.track,
          title: ps.title,
          provider: ps.provider,
          content: ps.content,
        },
      });
      console.log(`✓ Seeded: ${ps.psId}`);
    }

    console.log(
      `\n✓ Successfully seeded ${problemStatements.length} problem statements!`,
    );
  } catch (error) {
    console.error("Error seeding problem statements:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedProblemStatements().catch((error) => {
  console.error(error);
  process.exit(1);
});
