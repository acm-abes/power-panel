/** @format */

import { env } from "../config/env";
import { MailServiceFactory } from "../factories/mail-service.factory";

export * from "../interfaces/mail-service.interface";
export * from "../factories/mail-service.factory";
export * from "./resend-mail.service";
export * from "./ses-mail.service";

try {
  var mailService = MailServiceFactory.create(env.MAIL_PROVIDER);
  console.log(`✉️ Mail service initialized: ${mailService.getProviderName()}`);
} catch (error: any) {
  console.error("❌ Failed to initialize mail service:", error.message);
  throw error;
}

export { mailService };
