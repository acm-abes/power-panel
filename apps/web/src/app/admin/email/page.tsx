/** @format */

"use client";

import { useState } from "react";
import { useEmailSender } from "@/hooks/use-email-sender";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { EmailTagInput } from "@/components/email-tag-input";

export default function SendEmailPage() {
  const {
    emails,
    selectedPreset,
    isPending,
    customCc,
    customBcc,
    customSubject,
    customHtml,
    addEmail,
    removeEmail,
    clearEmails,
    addCcEmail,
    removeCcEmail,
    addBccEmail,
    removeBccEmail,
    setSelectedPreset,
    setCustomSubject,
    setCustomHtml,
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

      <div className="space-y-6">
        {/* Step 1: Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                1
              </span>
              Email Configuration
            </CardTitle>
            <CardDescription>
              Select template and configure email options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Email Template</label>
                <Select
                  value={selectedPreset}
                  onValueChange={(value) =>
                    setSelectedPreset(value as EmailPreset)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOMPLETE_TEAM">
                      Incomplete Team Alert
                    </SelectItem>
                    <SelectItem value="INAUGURATION_INVITE">
                      Inauguration Invite
                    </SelectItem>
                    <SelectItem value="CUSTOM">Custom HTML Email</SelectItem>
                  </SelectContent>
                </Select>

                {selectedPreset === "INCOMPLETE_TEAM" && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p className="font-medium">Includes:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Personalized team details</li>
                      <li>Current team size</li>
                      <li>Action required notice</li>
                    </ul>
                  </div>
                )}

                {selectedPreset === "INAUGURATION_INVITE" && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p className="font-medium">Includes:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Event details</li>
                      <li>Personalized greeting</li>
                      <li>Professional format</li>
                    </ul>
                  </div>
                )}

                {selectedPreset === "CUSTOM" && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Create your own email with custom HTML and subject.
                  </div>
                )}
              </div>

              {/* Email Fields */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Additional Recipients (Optional)
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      CC (press Space or Enter to add)
                    </label>
                    <EmailTagInput
                      emails={customCc}
                      onAdd={addCcEmail}
                      onRemove={removeCcEmail}
                      placeholder="cc@example.com"
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      BCC (press Space or Enter to add)
                    </label>
                    <EmailTagInput
                      emails={customBcc}
                      onAdd={addBccEmail}
                      onRemove={removeBccEmail}
                      placeholder="bcc@example.com"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Email Content - Full width when CUSTOM selected */}
            {selectedPreset === "CUSTOM" && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject *</label>
                    <Input
                      type="text"
                      placeholder="Email subject line"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      disabled={isPending}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      HTML Content *
                    </label>
                    <Textarea
                      placeholder="Paste your HTML content here..."
                      value={customHtml}
                      onChange={(e) => setCustomHtml(e.target.value)}
                      disabled={isPending}
                      className="mt-2 font-mono text-xs"
                      rows={10}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Recipient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                2
              </span>
              Select Recipients
            </CardTitle>
            <CardDescription>
              Load predefined lists or add emails manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Load Buttons */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Quick Load Options
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_1")}
                  disabled={isPending}
                  size="sm"
                  className="justify-start"
                >
                  <Users className="w-3 h-3 mr-2" />
                  Size = 1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_2")}
                  disabled={isPending}
                  size="sm"
                  className="justify-start"
                >
                  <Users className="w-3 h-3 mr-2" />
                  Size = 2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("TEAM_SIZE_3")}
                  disabled={isPending}
                  size="sm"
                  className="justify-start"
                >
                  <Users className="w-3 h-3 mr-2" />
                  Size = 3
                </Button>
                <Button
                  variant="outline"
                  onClick={loadIncompleteTeamsEmails}
                  disabled={isPending}
                  size="sm"
                  className="justify-start"
                >
                  <AlertTriangle className="w-3 h-3 mr-2" />
                  Incomplete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_PARTICIPANTS")}
                  disabled={isPending}
                  size="sm"
                >
                  All Participants
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_JUDGES")}
                  disabled={isPending}
                  size="sm"
                >
                  All Judges
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadEmailsByOption("ALL_MENTORS")}
                  disabled={isPending}
                  size="sm"
                >
                  All Mentors
                </Button>
              </div>
            </div>

            <Separator />

            {/* Manual Email Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add Manually
              </label>
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
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Email List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Recipients ({emails.length})
                </label>
                {emails.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearEmails}
                    disabled={isPending}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {emails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recipients added</p>
                  <p className="text-xs">Use quick load or add manually</p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <div className="divide-y">
                    {emails.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-mono">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(email)}
                          disabled={isPending}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Review & Send */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                3
              </span>
              Review & Send
            </CardTitle>
            <CardDescription>Confirm details before sending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold">{emails.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Template</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedPreset === "INCOMPLETE_TEAM"
                      ? "Incomplete Team"
                      : selectedPreset === "INAUGURATION_INVITE"
                        ? "Inauguration"
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
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending to {emails.length} recipients...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send {emails.length} Email{emails.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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
