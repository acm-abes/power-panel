/** @format */
import IORedis from "ioredis";
import { Queue } from "bullmq";

export const EMAIL_QUEUE = "email";

export type SendEmailJob = {
  to: string;
  subject: string;
  html: string;
  campaignId: string;
  userId: string;
};

export function createEmailQueue(connection: IORedis) {
  const queue = new Queue<SendEmailJob>(EMAIL_QUEUE, {
    connection,
  });

  return {
    enqueue(job: SendEmailJob, opts?: Parameters<typeof queue.add>[2]) {
      return queue.add("send", job, opts);
    },

    close() {
      return queue.close();
    },
  };
}
