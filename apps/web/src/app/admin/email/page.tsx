/** @format */

"use client";

import { useState } from "react";
import { useEmailSender } from "@/hooks/use-email-sender";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  X,
  Plus,
  Users,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { EmailPreset } from "@/actions/send-emails";

export default function SendEmailPage() {
  const {
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
  } = useEmailSender();

  const [emailInput, setEmailInput] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleAddEmail = () => {
    if (emailInput.trim()) {
      addEmail(emailInput);
      setEmailInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddEmail();
    }
  };

  const handleSendEmails = () => {
    setShowConfirmDialog(true);
  };

  const confirmSend = () => {
    setShowConfirmDialog(false);
    sendEmailsToList();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8" />
          Email Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Send emails to participants, judges, mentors, or custom lists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Email List Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Load Options */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Load Email Lists</CardTitle>
              <CardDescription>
                Load predefined email lists with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_1")}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Team Size = 1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_2")}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Team Size = 2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_3")}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Team Size = 3
                </Button>
                <Button
                  variant="outline"
                  onClick={loadIncompleteTeamsEmails}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Incomplete Teams
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_PARTICIPANTS")}
                  disabled={isPending}
                >
                  All Participants
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_JUDGES")}
                  disabled={isPending}
                >
                  All Judges
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_MENTORS")}
                  disabled={isPending}
                >
                  All Mentors
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Email Input */}
          <Card>
            <CardHeader>
              <CardTitle>Add Email Manually</CardTitle>
              <CardDescription>
                Type an email address and add it to the list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddEmail}
                  disabled={isPending || !emailInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email List Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email List</CardTitle>
                  <CardDescription>
                    {emails.length} email{emails.length !== 1 ? "s" : ""} in
                    list
                  </CardDescription>
                </div>
                {emails.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearEmails}
                    disabled={isPending}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No emails added yet</p>
                  <p className="text-sm">Use quick load or add manually</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {emails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <span className="text-sm font-mono">{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(email)}
                        disabled={isPending}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Email Configuration & Send */}
        <div className="space-y-6">
          {/* Email Preset Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
              <CardDescription>
                Choose which email template to send
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Preset</label>
                <Select
                  value={selectedPreset}
                  onValueChange={(value) =>
                    setSelectedPreset(value as EmailPreset)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOMPLETE_TEAM">
                      Incomplete Team Alert
                    </SelectItem>
                    <SelectItem value="INAUGURATION_INVITE">
                      Inauguration Invite
                    </SelectItem>
                    <SelectItem value="CUSTOM" disabled>
                      Custom Email (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Separator className="my-4" />

                {selectedPreset === "INCOMPLETE_TEAM" && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Template Info:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Personalized with team details</li>
                      <li>Shows current team size</li>
                      <li>Includes action required notice</li>
                      <li>Contains important dates</li>
                    </ul>
                  </div>
                )}

                {selectedPreset === "INAUGURATION_INVITE" && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Template Info:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Official invitation to inauguration</li>
                      <li>Includes event date, time & venue</li>
                      <li>Personalized with team name</li>
                      <li>Professional format</li>
                    </ul>
                  </div>
                )}

                {selectedPreset === "INAUGURATION_INVITE" && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Template Info:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Official invitation to inauguration</li>
                      <li>Includes event date, time & venue</li>
                      <li>Personalized with team name</li>
                      <li>Professional format</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Button & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Send Emails</CardTitle>
              <CardDescription>
                Review and send emails to the list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipients:</span>
                  <span className="font-bold">{emails.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Template:</span>
                  <Badge variant="outline">
                    {selectedPreset === "INCOMPLETE_TEAM"
                      ? "Incomplete Team"
                      : "Custom"}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={handleSendEmails}
                disabled={isPending || emails.length === 0}
                className="w-full"
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Email Send</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send emails to {emails.length} recipient
              {emails.length !== 1 ? "s" : ""}?
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This action cannot be undone. Emails will be sent immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSend}>Confirm & Send</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
