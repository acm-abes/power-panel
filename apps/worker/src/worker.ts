/** @format */

import "dotenv/config";
import { Worker } from "bullmq";
import { EMAIL_QUEUE, SendEmailJob } from "@power/queue";
import { connection } from "./redis";
import { sendMail } from "./mailer";
import { prisma } from "@power/db";
import { generateEmailContent } from "./templates";

console.log("📨 SAH 2.0 Email Worker starting...");
console.log("📧 Email provider: Resend");
console.log("🔄 Concurrency: 5 emails at a time");
console.log("");

const worker = new Worker<SendEmailJob>(
  EMAIL_QUEUE,
  async (job) => {
    const { to, recipientName, userId, template, templateData, campaignId } =
      job.data;

    console.log(`[${template}] ➡️ Sending to ${recipientName} <${to}>`);

    try {
      // Generate email content based on template
      const { subject, html } = generateEmailContent(
        template,
        recipientName,
        templateData,
      );

      // Send via Resend
      const result = await sendMail({ to, subject, html });

      // Track in database (skip if user doesn't exist)
      try {
        await prisma.emailJob.create({
          data: {
            campaignId,
            userId,
            email: to,
            status: "SENT",
            providerId: result.data?.id ?? null,
          },
        });
      } catch (dbError: any) {
        // Log but don't fail if tracking fails (e.g., user doesn't exist)
        console.warn(
          `[${template}] ⚠️ Could not track email for ${to}: ${dbError.code}`,
        );
      }

      console.log(`[${template}] [${Date.now()}] ✅ Sent to ${to}`);
    } catch (error) {
      console.error(`[${template}] ❌ Failed to send to ${to}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // SAH 2.0: 5 emails at a time to respect rate limits
  },
);

worker.on("failed", async (job, err) => {
  if (!job) return;

  console.error(
    `[${job.data.template}] ❌ Failed for ${job.data.to}:`,
    err.message,
  );

  // Try to track failure in database (but don't fail if user doesn't exist)
  try {
    await prisma.emailJob.create({
      data: {
        campaignId: job.data.campaignId,
        userId: job.data.userId,
        email: job.data.to,
        status: "FAILED",
        error: err.message,
      },
    });
  } catch (dbError: any) {
    console.warn(
      `[${job.data.template}] ⚠️ Could not track failed email for ${job.data.to}: ${dbError.code}`,
    );
  }
});

worker.on("completed", (job) => {
  console.log(`[${job.data.template}] ✨ Completed job ${job.id}`);
});

process.on("SIGTERM", async () => {
  console.log("");
  console.log("🛑 SAH 2.0 Worker shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  console.log("👋 Worker stopped");
  process.exit(0);
});
