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
