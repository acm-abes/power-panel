/** @format */

"use client";

import { useState } from "react";
import { toggleSubmissionLock } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
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
import { Lock, Unlock, Loader2 } from "lucide-react";

interface ToggleLockButtonProps {
  submissionId: string;
  isLocked: boolean;
  teamName: string;
}

export function ToggleLockButton({
  submissionId,
  isLocked,
  teamName,
}: ToggleLockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await toggleSubmissionLock(submissionId);
    } catch (error) {
      console.error("Failed to toggle lock:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={isLocked ? "default" : "destructive"}
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isLocked ? (
            <Unlock className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {isLocked ? "Unlock Submission" : "Lock Submission"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLocked ? "Unlock" : "Lock"} Submission
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLocked ? (
              <>
                Are you sure you want to unlock the submission for{" "}
                <strong>{teamName}</strong>? They will be able to modify or
                delete their submission.
              </>
            ) : (
              <>
                Are you sure you want to lock the submission for{" "}
                <strong>{teamName}</strong>? They will not be able to modify or
                delete their submission after this.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>
            {isLocked ? "Unlock" : "Lock"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
