/** @format */

import { ResendMailService, SESMailService, IMailService } from "./providers";
import { env } from "./config/mails";

export type MailProvider = "resend" | "ses";

/**
 * Factory to create mail service instances based on configuration
 */
export class MailServiceFactory {
  static create(provider: MailProvider): IMailService {
    switch (provider) {
      case "resend":
        return new ResendMailService(
          (env as Extract<typeof env, { MAIL_PROVIDER: "resend" }>)
            .RESEND_API_KEY,
          env.EMAIL_FROM,
        );

      case "ses":
        return new SESMailService({
          region: (env as Extract<typeof env, { MAIL_PROVIDER: "ses" }>)
            .AWS_REGION,
          fromEmail: env.EMAIL_FROM,
        });

      default:
        throw new Error(`Unsupported mail provider: ${provider}`);
    }
  }
}
