/** @format */

"use client";

import { useState } from "react";
import { deleteSubmission } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Lock, FileText, Calendar, ClipboardList } from "lucide-react";
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

interface ProblemStatement {
  id: string;
  psId: string;
  track: string;
  title: string;
  provider: string;
}

interface SubmissionDetailsProps {
  submission: {
    id: string;
    psId: string;
    documentPath: string;
    documentSize: number;
    additionalNotes: string | null;
    isLocked: boolean;
    submittedAt: Date;
    updatedAt: Date;
  };
  problemStatements: ProblemStatement[];
}

export function SubmissionDetails({
  submission,
  problemStatements,
}: SubmissionDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problemStatement = problemStatements.find(
    (ps) => ps.psId === submission.psId,
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDelete = async () => {
    if (submission.isLocked) {
      setError("Submission is locked and cannot be deleted");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteSubmission();
      // Page will revalidate and show the form again
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete submission",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Your Submission
          {submission.isLocked && (
            <Badge variant="destructive" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {submission.isLocked
            ? "This submission is locked and cannot be modified or deleted."
            : "Your project submission has been recorded. You can delete it and resubmit before the deadline."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Problem Statement</p>
                <div>
                  <Badge variant="outline" className="mb-2">
                    {submission.psId.toUpperCase()}
                  </Badge>
                  {problemStatement && (
                    <p className="text-sm text-muted-foreground">
                      {problemStatement.title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Document</p>
                <p className="text-sm text-muted-foreground">
                  {submission.documentPath.split("/").pop()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(submission.documentSize)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Presentation</p>
                <p className="text-sm text-muted-foreground">
                  {submission.pptPath.split("/").pop()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(submission.pptSize)}
                </p>
              </div>
            </div>

            {submission.additionalNotes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Additional Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submission.additionalNotes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Submission Timeline</p>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
                {submission.submittedAt !== submission.updatedAt && (
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(submission.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!submission.isLocked && (
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Submission
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this submission? This
                      action cannot be undone. You will be able to create a new
                      submission after deletion.
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
