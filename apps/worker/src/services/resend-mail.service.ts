/** @format */

import { Resend } from "resend";
import {
  IMailService,
  SendEmailParams,
  SendEmailResult,
} from "./mail-service.interface";

export class ResendMailService implements IMailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  getProviderName(): string {
    return "Resend";
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const resendAttachments = params.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        ...(att.cid && { content_id: att.cid }),
      }));

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        ...(resendAttachments &&
          resendAttachments.length > 0 && {
            attachments: resendAttachments,
          }),
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        providerId: result.data?.id ?? null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }
}
