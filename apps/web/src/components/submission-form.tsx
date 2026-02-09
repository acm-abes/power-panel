/** @format */

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createOrUpdateSubmission } from "@/actions/submissions";
import { uploadSubmissionFile } from "@/actions/upload-submission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface ProblemStatement {
  id: string;
  psId: string;
  track: string;
  title: string;
  provider: string;
}

interface SubmissionFormProps {
  problemStatements: ProblemStatement[];
}

export function SubmissionForm({ problemStatements }: SubmissionFormProps) {
  const [psId, setPsId] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const submissionMutation = useMutation({
    mutationFn: async ({
      psId,
      file,
      additionalNotes,
    }: {
      psId: string;
      file: File;
      additionalNotes?: string;
    }) => {
      // Upload file to storage service
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadSubmissionFile(formData);

      // Create submission with uploaded file details
      return createOrUpdateSubmission({
        psId,
        documentPath: uploadResult.path,
        documentSize: uploadResult.size,
        additionalNotes: additionalNotes || undefined,
      });
    },
    onSuccess: () => {
      router.refresh();
      toast.success("Submission created successfully!");
      // Reset form
      setPsId("");
      setAdditionalNotes("");
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById("document") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit");
    },
  });

  // Group problem statements by track
  const groupedPS = problemStatements.reduce(
    (acc, ps) => {
      if (!acc[ps.track]) {
        acc[ps.track] = [];
      }
      acc[ps.track].push(ps);
      return acc;
    },
    {} as Record<string, ProblemStatement[]>,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!psId) {
      toast.error("Problem Statement is required");
      return;
    }

    if (!file) {
      toast.error("Document file is required");
      return;
    }

    submissionMutation.mutate({ psId, file, additionalNotes });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Submission</CardTitle>
        <CardDescription>
          Submit your project for evaluation. Fill in the required details
          below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="psId">
              Problem Statement <span className="text-destructive">*</span>
            </Label>
            <Select
              value={psId}
              onValueChange={setPsId}
              disabled={submissionMutation.isPending}
            >
              <SelectTrigger id="psId">
                <SelectValue placeholder="Select a problem statement" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedPS).map(([track, statements]) => (
                  <div key={track}>
                    <div className="px-2 py-1.5 text-sm font-semibold capitalize text-muted-foreground">
                      {track === "ai"
                        ? "AI"
                        : track === "web3"
                          ? "Web3"
                          : track.charAt(0).toUpperCase() + track.slice(1)}
                    </div>
                    {statements.map((ps) => (
                      <SelectItem key={ps.psId} value={ps.psId}>
                        {ps.psId.toUpperCase()} - {ps.title.substring(0, 50)}
                        {ps.title.length > 50 ? "..." : ""}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {psId && (
              <p className="text-xs text-muted-foreground">
                Selected:{" "}
                {problemStatements.find((ps) => ps.psId === psId)?.title}
                <br />
                To view the problem statement details, please refer to the{" "}
                <a
                  href={`https://smartabeshackathon.tech/problem-statements/${psId.split("-")[0]}/${psId.split("-").slice(1).join("-")}`}
                  className="text-cyan-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  problem statement page
                </a>
                .
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">
              Document <span className="text-destructive">*</span>
            </Label>
            <Input
              id="document"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={submissionMutation.isPending}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            <p className="text-xs text-muted-foreground">
              <span>
                The doc defining your solution. It must follow the format
                specified{" "}
                <a
                  href=""
                  className="text-cyan-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                <br />
              </span>
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
              disabled={submissionMutation.isPending}
            />
          </div>

          <Button type="submit" disabled={submissionMutation.isPending}>
            {submissionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Submission
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
