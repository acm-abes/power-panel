/** @format */

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
  cid?: string;
}

export interface SendEmailParams {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  providerId?: string | null;
  error?: string;
}

/**
 * Mail service interface for different email providers
 */
export interface IMailService {
  /**
   * Send an email using the provider's API
   */
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;

  /**
   * Get the provider name (e.g., "Resend", "SES")
   */
  getProviderName(): string;
}
