/** @format */
import IORedis from "ioredis";
import { Queue } from "bullmq";

export const EMAIL_QUEUE = "sah-emails";

// Simple email job - just send what's given
export type SendEmailJob = {
  // Email fields
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;

  // Tracking data
  campaignId: string;
  userId: string;
};

export function createEmailQueue(connection: IORedis) {
  const queue = new Queue<SendEmailJob>(EMAIL_QUEUE, {
    connection,
  });

  return {
    enqueue(job: SendEmailJob, opts?: Parameters<typeof queue.add>[2]) {
      return queue.add("send-sah-email", job, opts);
    },

    close() {
      return queue.close();
    },
  };
}
