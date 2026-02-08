/** @format */

import { masterQueue } from "./queue";
import { UPLOAD_JOB, UploadJobData } from "@power/jobs/upload";

export function enqueueUpload(payload: UploadJobData) {
  return masterQueue.add(UPLOAD_JOB, payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
