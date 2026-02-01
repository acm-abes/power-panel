/** @format */

import { MailServiceFactory } from "./services/mail-service.factory";
import { env } from "./env";

try {
  var mailService = MailServiceFactory.create(env.MAIL_PROVIDER);
  console.log(`✉️ Mail service initialized: ${mailService.getProviderName()}`);
} catch (error: any) {
  console.error("❌ Failed to initialize mail service:", error.message);
  throw error;
}

export { mailService };

/**
 * Legacy sendMail function for backward compatibility
 * @deprecated Use mailService.sendEmail() directly for better error handling
 */
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
  const result = await mailService.sendEmail({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send email");
  }

  // Return Resend-compatible response for backward compatibility
  return {
    data: result.providerId ? { id: result.providerId } : null,
    error: null,
  };
}
