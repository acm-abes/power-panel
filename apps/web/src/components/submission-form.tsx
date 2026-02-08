/** @format */

"use client";

import { useState } from "react";
import {
  createOrUpdateSubmission,
  deleteSubmission,
} from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload, Trash2, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubmissionFormProps {
  existingSubmission?: {
    id: string;
    psId: string;
    documentPath: string;
    documentSize: number;
    additionalNotes: string | null;
    isLocked: boolean;
    submittedAt: Date;
  } | null;
}

export function SubmissionForm({ existingSubmission }: SubmissionFormProps) {
  const [psId, setPsId] = useState(existingSubmission?.psId || "");
  const [additionalNotes, setAdditionalNotes] = useState(
    existingSubmission?.additionalNotes || "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLocked = existingSubmission?.isLocked || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      setError("Submission is locked and cannot be modified");
      return;
    }

    if (!psId) {
      setError("Problem Statement ID is required");
      return;
    }

    // If no existing submission, file is required
    if (!existingSubmission && !file) {
      setError("Document file is required");
      return;
    }

    // If updating and a new file is provided
    if (existingSubmission && !file) {
      // Just update the metadata without a new file
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        await createOrUpdateSubmission({
          psId,
          documentPath: existingSubmission.documentPath,
          documentSize: existingSubmission.documentSize,
          additionalNotes: additionalNotes || undefined,
        });
        setSuccess("Submission updated successfully!");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update submission",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Upload file to storage service
      // For now, we'll use a placeholder path
      const documentPath = `submissions/team-${Date.now()}/${file.name}`;
      const documentSize = file.size;

      await createOrUpdateSubmission({
        psId,
        documentPath,
        documentSize,
        additionalNotes: additionalNotes || undefined,
      });

      setSuccess(
        existingSubmission
          ? "Submission updated successfully!"
          : "Submission created successfully!",
      );
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLocked) {
      setError("Submission is locked and cannot be deleted");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteSubmission();
      setSuccess("Submission deleted successfully!");
      setPsId("");
      setAdditionalNotes("");
      setFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete submission",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {existingSubmission ? "Update Submission" : "Create Submission"}
          {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
        <CardDescription>
          {isLocked
            ? "This submission is locked and cannot be modified."
            : existingSubmission
              ? "Update your project submission. You can replace the document or update other fields."
              : "Submit your project for evaluation. Fill in the required details below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="psId">
              Problem Statement ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="psId"
              value={psId}
              onChange={(e) => setPsId(e.target.value)}
              placeholder="e.g., PS001"
              disabled={isLoading || isLocked}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">
              Document{" "}
              {!existingSubmission && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            {existingSubmission && (
              <div className="text-sm text-muted-foreground mb-2">
                Current: {existingSubmission.documentPath.split("/").pop()} (
                {formatFileSize(existingSubmission.documentSize)})
              </div>
            )}
            <Input
              id="document"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isLoading || isLocked}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, DOC, DOCX, PPT, PPTX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes / Recommendations</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional information or recommendations..."
              rows={4}
              disabled={isLoading || isLocked}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isLocked}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingSubmission ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {existingSubmission
                    ? "Update Submission"
                    : "Create Submission"}
                </>
              )}
            </Button>

            {existingSubmission && !isLocked && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this submission? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {existingSubmission && (
            <div className="text-xs text-muted-foreground">
              Submitted on:{" "}
              {new Date(existingSubmission.submittedAt).toLocaleString()}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
