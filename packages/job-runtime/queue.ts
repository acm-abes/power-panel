/** @format */

import { Queue } from "bullmq";
import { connection } from "./connection";

export const mainQueue = new Queue("main-queue", { connection });
