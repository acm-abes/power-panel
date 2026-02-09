/** @format */

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEmailsByOption,
  sendEmails,
  getIncompleteTeamsData,
  type EmailListOption,
  type EmailPreset,
  EmailData,
} from "@/actions/send-emails";

export function useEmailSender() {
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] =
    useState<EmailPreset>("INCOMPLETE_TEAM");

  // Custom email data
  const [customCc, setCustomCc] = useState<string[]>([]);
  const [customBcc, setCustomBcc] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [customAttachments, setCustomAttachments] = useState<
    Array<{
      filename: string;
      content: string;
      contentType: string;
      cid: string;
    }>
  >([]);

  // Load emails by option mutation
  const loadEmailsMutation = useMutation({
    mutationFn: (option: EmailListOption) => getEmailsByOption(option),
    onSuccess: (response) => {
      if (response.success) {
        setEmails(response.emails);
        toast.success(`Loaded ${response.count} emails`);
      } else {
        toast.error(response.error || "Failed to load emails");
      }
    },
  });

  // Load incomplete teams mutation
  const loadIncompleteTeamsMutation = useMutation({
    mutationFn: () => getIncompleteTeamsData(),
    onSuccess: (response) => {
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
    },
  });

  // Send emails mutation
  const sendEmailsMutation = useMutation({
    mutationFn: ({
      emails,
      preset,
      customData,
    }: {
      emails: string[];
      preset: EmailPreset;
      customData: EmailData;
    }) => sendEmails(emails, preset, customData),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          response.message ||
            `Successfully sent emails to ${response.sent} recipients`,
        );
      } else {
        toast.error(response.error || "Failed to send emails");
      }
    },
  });

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

  const addCcEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid CC email format");
      return;
    }

    if (customCc.includes(trimmedEmail)) {
      toast.error("CC email already added");
      return;
    }

    setCustomCc((prev) => [...prev, trimmedEmail]);
  };

  const removeCcEmail = (email: string) => {
    setCustomCc((prev) => prev.filter((e) => e !== email));
  };

  const addBccEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid BCC email format");
      return;
    }

    if (customBcc.includes(trimmedEmail)) {
      toast.error("BCC email already added");
      return;
    }

    setCustomBcc((prev) => [...prev, trimmedEmail]);
  };

  const removeBccEmail = (email: string) => {
    setCustomBcc((prev) => prev.filter((e) => e !== email));
  };

  const addAttachment = (attachment: {
    filename: string;
    content: string;
    contentType: string;
    cid: string;
  }) => {
    setCustomAttachments((prev) => [...prev, attachment]);
  };

  const removeAttachment = (cid: string) => {
    setCustomAttachments((prev) => prev.filter((a) => a.cid !== cid));
  };

  const loadEmailsByOption = (option: EmailListOption) => {
    loadEmailsMutation.mutate(option);
  };

  const loadIncompleteTeamsEmails = () => {
    loadIncompleteTeamsMutation.mutate();
  };

  const sendEmailsToList = () => {
    if (emails.length === 0) {
      toast.error("No emails in list");
      return;
    }

    const customData =
      selectedPreset === "CUSTOM"
        ? {
            cc: customCc.length > 0 ? customCc.join(", ") : undefined,
            bcc: customBcc.length > 0 ? customBcc.join(", ") : undefined,
            subject: customSubject,
            html: customHtml,
            attachments:
              customAttachments.length > 0 ? customAttachments : undefined,
          }
        : {
            cc: customCc.length > 0 ? customCc.join(", ") : undefined,
            bcc: customBcc.length > 0 ? customBcc.join(", ") : undefined,
            attachments:
              customAttachments.length > 0 ? customAttachments : undefined,
          };

    sendEmailsMutation.mutate({ emails, preset: selectedPreset, customData });
  };

  return {
    emails,
    selectedPreset,
    isPending:
      loadEmailsMutation.isPending ||
      loadIncompleteTeamsMutation.isPending ||
      sendEmailsMutation.isPending,
    customCc,
    customBcc,
    customSubject,
    customHtml,
    customAttachments,
    addEmail,
    removeEmail,
    clearEmails,
    addCcEmail,
    removeCcEmail,
    addBccEmail,
    removeBccEmail,
    addAttachment,
    removeAttachment,
    setSelectedPreset,
    setCustomSubject,
    setCustomHtml,
    loadEmailsByOption,
    loadIncompleteTeamsEmails,
    sendEmailsToList,
  };
}
