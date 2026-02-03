/** @format */
import IORedis from "ioredis";
import { Queue } from "bullmq";
import { SEND_MAIL_JOB, SendMailPayload } from "../jobs/send-mail";

export function createEmailQueue(connection: IORedis) {
  const queue = new Queue<SendMailPayload>(SEND_MAIL_JOB, {
    connection,
  });

  return {
    enqueue(job: SendMailPayload, opts?: Parameters<typeof queue.add>[2]) {
      return queue.add("send-sah-email", job, opts);
    },

    close() {
      return queue.close();
    },
  };
}
