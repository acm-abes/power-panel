/** @format */

import { Worker } from "bullmq";
import { prisma } from "@power/db";
import { connection } from "@power/job-runtime/connection";
import { SEND_MAIL_JOB, sendMailHandler } from "@power/jobs/send-mail";
import { CONCURRENCY, QUEUE_NAME } from "./config";

console.log("📨 SAH 2.0 Email Worker starting...");
console.log(`🔄 Concurrency: ${CONCURRENCY} emails at a time`);
console.log("");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    switch (job.name) {
      case SEND_MAIL_JOB:
        await sendMailHandler(job.data);
        break;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

process.on("SIGTERM", async () => {
  console.log("");
  console.log("🛑 SAH 2.0 Worker shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  console.log("👋 Worker stopped");
  process.exit(0);
});
