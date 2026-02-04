/** @format */

import { Queue } from "bullmq";
import { connection } from "./connection";

export const QUEUE_NAME = "master-queue";

export const masterQueue = new Queue(QUEUE_NAME, { connection });
