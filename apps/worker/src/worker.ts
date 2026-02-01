/** @format */

import { Worker } from "bullmq";
import { EMAIL_QUEUE, SendEmailJob } from "@power/queue";
import { connection } from "./redis";
import { mailService } from "./mailer";
import { prisma } from "@power/db";

const CONCURRENCY = 2;

console.log("📨 SAH 2.0 Email Worker starting...");
console.log(`📧 Email provider: ${mailService.getProviderName()}`);
console.log(`🔄 Concurrency: ${CONCURRENCY} emails at a time`);
console.log("🎯 Mode: Dumb sender (no template logic)");
console.log("");

const worker = new Worker<SendEmailJob>(
  EMAIL_QUEUE,
  async (job) => {
    const { to, cc, bcc, subject, html, attachments, userId, campaignId } =
      job.data;

    console.log(`➡️ Sending to ${to} - ${subject}`);

    try {
      const result = await mailService.sendEmail({
        to,
        cc,
        bcc,
        subject,
        html,
        attachments,
      });

      try {
        await prisma.emailJob.create({
          data: {
            campaignId,
            userId,
            email: to,
            status: "SENT",
            providerId: result.providerId ?? null,
          },
        });
      } catch (dbError: any) {
        // Log but don't fail if tracking fails (e.g., user doesn't exist)
        console.warn(`⚠️ Could not track email for ${to}: ${dbError.code}`);
      }

      console.log(`[${new Date().toISOString()}] ✅ Sent to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send to ${to}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

worker.on("failed", async (job, err) => {
  if (!job) return;

  console.error(`❌ Failed for ${job.data.to}:`, err.message);

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
      `⚠️ Could not track failed email for ${job.data.to}: ${dbError.code}`,
    );
  }
});

worker.on("completed", (job) => {
  console.log(`✨ Completed job ${job.id}`);
});

process.on("SIGTERM", async () => {
  console.log("");
  console.log("🛑 SAH 2.0 Worker shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  console.log("👋 Worker stopped");
  process.exit(0);
});
