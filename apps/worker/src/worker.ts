/** @format */

import { Worker } from "bullmq";
import { prisma } from "@power/db";
import { connection } from "@power/job-runtime/connection";
import { SEND_MAIL_JOB, sendMailHandler } from "@power/jobs/send-mail";
import { CONCURRENCY, QUEUE_NAME, RATE_LIMIT } from "./config/queue";
import { UPLOAD_JOB, uploadHandler } from "@power/jobs/upload";

console.log("📨 SAH 2.0 Email Worker starting...");
console.log(`🔄 Concurrency: ${CONCURRENCY} jobs at a time`);
console.log(
  `⏱️  Rate Limit: ${RATE_LIMIT.max} emails per ${RATE_LIMIT.duration}ms`,
);
console.log(`📦 Queue Name: ${QUEUE_NAME}`);
console.log(`🔗 Redis URL: ${connection.url || "localhost:6379"}`);
console.log("");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`\n🔧 Processing job: ${job.name} (ID: ${job.id})`);

    switch (job.name) {
      case SEND_MAIL_JOB:
        await sendMailHandler(job.data);
        break;
      case UPLOAD_JOB:
        await uploadHandler(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
    limiter: RATE_LIMIT,
  },
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed: ${job.name}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${job?.name}`, err.message);
});

worker.on("ready", () => {
  console.log("🚀 Worker is ready and listening for jobs...\n");
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

process.on("SIGTERM", async () => {
  console.log("");
  console.log("🛑 SAH 2.0 Worker shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  console.log("👋 Worker stopped");
  process.exit(0);
});
