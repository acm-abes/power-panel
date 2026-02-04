/** @format */

import { mailService } from "../mails/services";
import { prisma } from "@power/db";

export const SEND_MAIL_JOB = "sah-mails";

export type SendMailPayload = {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
    cid?: string;
  }>;

  campaignId: string;
  userId: string;
};

export async function sendMailHandler(payload: SendMailPayload) {
  const { to, cc, bcc, subject, html, attachments, userId, campaignId } =
    payload;

  console.log(`➡️ Sending to ${to} - ${subject}`);

  try {
    const result = await mailService.sendEmail({
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
    });

    try {
      await prisma.emailJob.create({
        data: {
          campaignId,
          userId,
          email: to,
          status: "SENT",
          providerId: result.providerId ?? null,
        },
      });
    } catch (dbError: any) {
      console.warn(`⚠️ Could not track email for ${to}: ${dbError.code}`);
    }

    console.log(`[${new Date().toISOString()}] ✅ Sent to ${to}`);
  } catch (error: any) {
    try {
      await prisma.emailJob.create({
        data: {
          campaignId: payload.campaignId,
          userId: payload.userId,
          email: payload.to,
          status: "FAILED",
          error: error.message,
        },
      });
    } catch (dbError: any) {
      console.warn(
        `⚠️ Could not track failed email for ${payload.to}: ${dbError.code}`,
      );
    }
  }
}
