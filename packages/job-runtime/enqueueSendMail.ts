/** @format */

import { masterQueue } from "./queue";
import { SEND_MAIL_JOB, SendMailPayload } from "@power/jobs/send-mail";

export function enqueueSendMail(payload: SendMailPayload) {
  return masterQueue.add(SEND_MAIL_JOB, payload);
}
