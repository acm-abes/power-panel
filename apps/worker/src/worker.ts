/** @format */

import "dotenv/config";
import { Worker } from "bullmq";
import { EMAIL_QUEUE, SendEmailJob } from "@power/queue";
import { connection } from "./redis";
import { sendMail } from "./mailer";
import { prisma } from "@power/db";

console.log("📨 Email worker starting...");

const worker = new Worker<SendEmailJob>(
  EMAIL_QUEUE,
  async (job) => {
    const { to, subject, html, campaignId, userId } = job.data;

    console.log(`➡️ Sending to ${to}`);

    const result = await sendMail({ to, subject, html });

    await prisma.emailJob.create({
      data: {
        campaignId,
        userId,
        email: to,
        status: "SENT",
        providerId: result.data?.id ?? null,
      },
    });

    console.log(`✅ Sent to ${to}`);
  },
  {
    connection,
    concurrency: 5, // rate limit = your spam shield
  },
);

worker.on("failed", async (job, err) => {
  if (!job) return;

  console.error(`❌ Failed ${job.data.to}`, err.message);

  await prisma.emailJob.create({
    data: {
      campaignId: job.data.campaignId,
      userId: job.data.userId,
      email: job.data.to,
      status: "FAILED",
      error: err.message,
    },
  });
});

process.on("SIGTERM", async () => {
  console.log("🛑 Worker shutting down...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
