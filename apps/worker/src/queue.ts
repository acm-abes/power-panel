/** @format */

import { Queue } from "bullmq";
import { connection } from "./redis";
import { EMAIL_QUEUE } from "@power/queue";

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection,
});
