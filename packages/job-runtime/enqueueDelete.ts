/** @format */

import { masterQueue } from "./queue";
import { DELETE_JOB, DeleteJobData } from "@power/jobs/delete";

export async function enqueueDelete(payload: DeleteJobData) {
  console.log(`🔄 Enqueueing delete job: ${payload.path}`);

  const job = await masterQueue.add(DELETE_JOB, payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  console.log(`✅ Delete job enqueued with ID: ${job.id}`);
  return job;
}
