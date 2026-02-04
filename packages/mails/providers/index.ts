/** @format */

import { MailProvider, MailServiceFactory } from "../factory";

export * from "../interface";
export * from "../factory";
export * from "./resend.mail";
export * from "./ses.mail";

try {
  var mailService = MailServiceFactory.create(
    process.env.MAIL_PROVIDER as MailProvider,
  );
  console.log(`✉️ Mail service initialized: ${mailService.getProviderName()}`);
} catch (error: any) {
  console.error("❌ Failed to initialize mail service:", error.message);
  throw error;
}

export { mailService };
