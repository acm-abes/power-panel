/** @format */

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendMail({
  to,
  cc,
  bcc,
  subject,
  html,
}: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    cc,
    bcc,
    subject,
    html,
  });
}
