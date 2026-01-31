/** @format */

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  });
}
