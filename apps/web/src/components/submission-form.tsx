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
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const router = useRouter();

  const submissionMutation = useMutation({
    mutationFn: async ({
      psId,
      documentFile,
      pptFile,
      additionalNotes,
    }: {
      psId: string;
      documentFile: File;
      pptFile: File;
      additionalNotes?: string;
    }) => {
      // Upload document file to storage service
      const documentFormData = new FormData();
      documentFormData.append("file", documentFile);
      const documentUploadResult = await uploadSubmissionFile(documentFormData);

      // Upload PPT file if provided

      const pptFormData = new FormData();
      pptFormData.append("file", pptFile);
      const pptUploadResult = await uploadSubmissionFile(pptFormData);

      // Create submission with uploaded file details
      return createOrUpdateSubmission({
        psId,
        documentPath: documentUploadResult.path,
        documentSize: documentUploadResult.size,
        pptPath: pptUploadResult.path,
        pptSize: pptUploadResult.size,
        additionalNotes: additionalNotes || undefined,
      });
    },
    onSuccess: () => {
      router.refresh();
      toast.success("Submission created successfully!");
      // Reset form
      setPsId("");
      setAdditionalNotes("");
      setDocumentFile(null);
      setPptFile(null);
      // Reset file inputs
      const documentInput = document.getElementById(
        "document",
      ) as HTMLInputElement;
      if (documentInput) documentInput.value = "";
      const pptInput = document.getElementById("ppt") as HTMLInputElement;
      if (pptInput) pptInput.value = "";
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

    if (!documentFile) {
      toast.error("Document file is required");
      return;
    }

    if (!pptFile) {
      toast.error("Presentation file is required");
      return;
    }

    const documentExt = documentFile.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "doc", "docx"].includes(documentExt || "")) {
      toast.error("Document must be PDF, DOC, or DOCX format");
      return;
    }

    const pptExt = pptFile.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "pptx"].includes(pptExt || "")) {
      toast.error("PPT must be PDF or PPTX format");
      return;
    }

    submissionMutation.mutate({
      psId,
      documentFile,
      pptFile: pptFile,
      additionalNotes,
    });
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
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              disabled={submissionMutation.isPending}
              accept=".pdf,.doc,.docx"
            />
            <p className="text-xs text-muted-foreground">
              <span>
                The document defining your solution. It must follow the format
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
              Accepted formats: PDF, DOC, DOCX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ppt">
              Presentation <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ppt"
              type="file"
              onChange={(e) => setPptFile(e.target.files?.[0] || null)}
              disabled={submissionMutation.isPending}
              accept=".pdf,.pptx"
            />
            <p className="text-xs text-muted-foreground">
              Upload your presentation file.
              <br />
              Accepted formats: PDF, PPTX
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Create Submission
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
