/** @format */
import IORedis from "ioredis";
import { Queue } from "bullmq";

export const EMAIL_QUEUE = "sah-emails";

// SAH 2.0 Email Templates
export type EmailTemplate =
  | "INCOMPLETE_TEAM"
  | "WELCOME"
  | "REMINDER"
  | "ANNOUNCEMENT";

// Email job for SAH 2.0 Hackathon
export type SendEmailJob = {
  // Recipient info
  to: string;
  recipientName: string;
  userId: string;

  // Email template
  template: EmailTemplate;

  // Template-specific data
  templateData:
    | IncompleteTeamData
    | WelcomeData
    | ReminderData
    | AnnouncementData;

  // Tracking
  campaignId: string;
};

// Template data types for SAH 2.0
export type IncompleteTeamData = {
  teamName: string;
  teamCode: string;
  membersInTeam: number;
};

export type WelcomeData = {
  teamName?: string;
};

export type ReminderData = {
  eventName: string;
  eventDate: string;
  message: string;
};

export type AnnouncementData = {
  title: string;
  message: string;
};

export function createEmailQueue(connection: IORedis) {
  const queue = new Queue<SendEmailJob>(EMAIL_QUEUE, {
    connection,
  });

  return {
    enqueue(job: SendEmailJob, opts?: Parameters<typeof queue.add>[2]) {
      return queue.add("send-sah-email", job, opts);
    },

    close() {
      return queue.close();
    },
  };
}
