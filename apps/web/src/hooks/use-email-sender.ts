/** @format */

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getEmailsByOption,
  sendEmails,
  getIncompleteTeamsData,
  type EmailListOption,
  type EmailPreset,
} from "@/actions/send-emails";

export function useEmailSender() {
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<EmailPreset>("INCOMPLETE_TEAM");
  const [isPending, startTransition] = useTransition();

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid email format");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error("Email already in list");
      return;
    }

    setEmails((prev) => [...prev, trimmedEmail]);
    toast.success("Email added to list");
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const clearEmails = () => {
    setEmails([]);
    toast.info("Email list cleared");
  };

  const loadEmailsByOption = async (option: EmailListOption) => {
    startTransition(async () => {
      const response = await getEmailsByOption(option);

      if (response.success) {
        setEmails(response.emails);
        toast.success(`Loaded ${response.count} emails`);
      } else {
        toast.error(response.error || "Failed to load emails");
      }
    });
  };

  const loadIncompleteTeamsEmails = async () => {
    startTransition(async () => {
      const response = await getIncompleteTeamsData();

      if (response.success) {
        const allEmails = response.teams.flatMap((team) => team.emails);
        const uniqueEmails = [...new Set(allEmails)];
        setEmails(uniqueEmails);
        toast.success(
          `Loaded ${uniqueEmails.length} emails from ${response.count} incomplete teams`,
        );
      } else {
        toast.error(response.error || "Failed to load incomplete teams");
      }
    });
  };

  const sendEmailsToList = async () => {
    if (emails.length === 0) {
      toast.error("No emails in list");
      return;
    }

    startTransition(async () => {
      const loadingToast = toast.loading("Sending emails...");
      const response = await sendEmails(emails, selectedPreset);

      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(
          response.message ||
            `Successfully sent emails to ${response.sent} recipients`,
        );
      } else {
        toast.error(response.error || "Failed to send emails");
      }
    });
  };

  return {
    emails,
    selectedPreset,
    isPending,
    addEmail,
    removeEmail,
    clearEmails,
    setSelectedPreset,
    loadEmailsByOption,
    loadIncompleteTeamsEmails,
    sendEmailsToList,
  };
}
