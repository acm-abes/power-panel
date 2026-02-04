/** @format */

import {
  IMailService,
  SendEmailParams,
  SendEmailResult,
} from "../interfaces/mail-service.interface";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

/**
 * AWS SES Mail Service Implementation
 */
export class SESMailService implements IMailService {
  private fromEmail: string;
  private sesClient: SESClient;

  constructor(config: { region: string; fromEmail: string }) {
    this.fromEmail = config.fromEmail;
    this.sesClient = new SESClient({ region: config.region });
  }

  getProviderName(): string {
    return "AWS SES";
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const rawMessage = this.buildMimeMessage(params);

      const command = new SendRawEmailCommand({
        Source: this.fromEmail,
        Destinations: [params.to, ...(params.cc || []), ...(params.bcc || [])],
        RawMessage: {
          Data: Buffer.from(rawMessage),
        },
      });

      const result = await this.sesClient.send(command);

      return {
        success: true,
        providerId: result.MessageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  /**
   * Build MIME message for SES (handles attachments, CC, BCC, etc.)
   */
  private buildMimeMessage(params: SendEmailParams): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const attachmentBoundary = `----=_Attachment_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    let mimeMessage = "";

    // Headers
    mimeMessage += `From: ${this.fromEmail}\r\n`;
    mimeMessage += `To: ${params.to}\r\n`;

    if (params.cc && params.cc.length > 0) {
      mimeMessage += `Cc: ${params.cc.join(", ")}\r\n`;
    }

    if (params.bcc && params.bcc.length > 0) {
      mimeMessage += `Bcc: ${params.bcc.join(", ")}\r\n`;
    }

    mimeMessage += `Subject: ${params.subject}\r\n`;
    mimeMessage += `MIME-Version: 1.0\r\n`;

    // If we have attachments, use multipart/mixed
    if (params.attachments && params.attachments.length > 0) {
      mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

      // HTML body part
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
      mimeMessage += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      mimeMessage += `${this.encodeQuotedPrintable(params.html)}\r\n\r\n`;

      // Attachments
      for (const attachment of params.attachments) {
        mimeMessage += `--${boundary}\r\n`;
        mimeMessage += `Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${attachment.filename}"\r\n`;
        mimeMessage += `Content-Transfer-Encoding: base64\r\n`;
        mimeMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;

        if (attachment.cid) {
          mimeMessage += `Content-ID: <${attachment.cid}>\r\n`;
        }

        mimeMessage += `\r\n`;
        mimeMessage += `${this.formatBase64(attachment.content)}\r\n\r\n`;
      }

      mimeMessage += `--${boundary}--\r\n`;
    } else {
      // Simple HTML email without attachments
      mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
      mimeMessage += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      mimeMessage += `${this.encodeQuotedPrintable(params.html)}\r\n`;
    }

    return mimeMessage;
  }

  /**
   * Encode string as quoted-printable for email body
   */
  private encodeQuotedPrintable(text: string): string {
    // Simple quoted-printable encoding
    // For production, consider using a library for proper encoding
    return text
      .replace(/[\x80-\xFF=]/g, (char) => {
        const hex = char.charCodeAt(0).toString(16).toUpperCase();
        return `=${hex.padStart(2, "0")}`;
      })
      .replace(/\r?\n/g, "\r\n")
      .split("\r\n")
      .map((line) => {
        // Break lines longer than 76 characters
        if (line.length <= 76) return line;
        const chunks = [];
        for (let i = 0; i < line.length; i += 75) {
          chunks.push(line.substring(i, i + 75) + "=");
        }
        return chunks.join("\r\n");
      })
      .join("\r\n");
  }

  /**
   * Format base64 content with line breaks (76 chars per line as per RFC)
   */
  private formatBase64(base64: string): string {
    // Remove any existing whitespace
    const clean = base64.replace(/\s/g, "");
    // Add line breaks every 76 characters
    const chunks = [];
    for (let i = 0; i < clean.length; i += 76) {
      chunks.push(clean.substring(i, i + 76));
    }
    return chunks.join("\r\n");
  }
}
