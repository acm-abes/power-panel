/** @format */

import { Queue } from "bullmq";
import IORedis from "ioredis";
import { EMAIL_QUEUE, SendEmailJob } from "..";
/**
 * Producer-side queue (web app)
 *
 * @format
 */
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
