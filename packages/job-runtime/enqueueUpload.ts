/** @format */

import { masterQueue } from "./queue";
import { UPLOAD_JOB, UploadJobData } from "@power/jobs/upload";

export async function enqueueUpload(payload: UploadJobData) {
  console.log(`🔄 Enqueueing upload job: ${payload.filePath}`);

  // Convert Buffer to base64 string for Redis serialization
  const serializedPayload = {
    ...payload,
    body: payload.body.toString("base64"),
  };

  const job = await masterQueue.add(UPLOAD_JOB, serializedPayload, {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  console.log(`✅ Job enqueued with ID: ${job.id}`);
  return job;
}
