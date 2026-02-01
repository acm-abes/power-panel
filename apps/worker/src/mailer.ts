/** @format */

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendMail({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments,
}: {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    cid?: string;
  }>;
}) {
  // Convert attachments to Resend format
  const resendAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: att.content, // Resend accepts base64 strings
    ...(att.cid && { content_id: att.cid }), // For inline images
  }));

  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    cc,
    bcc,
    subject,
    html,
    ...(resendAttachments &&
      resendAttachments.length > 0 && {
        attachments: resendAttachments,
      }),
  });
}
