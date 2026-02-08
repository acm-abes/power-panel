/** @format */

"use client";

import { useState } from "react";
import { createOrUpdateSubmission } from "@/actions/submissions";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!psId) {
      setError("Problem Statement is required");
      return;
    }

    if (!file) {
      setError("Document file is required");
      return;
    }

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

      setSuccess("Submission created successfully!");
      // Reset form
      setPsId("");
      setAdditionalNotes("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsLoading(false);
    }
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
              Problem Statement <span className="text-destructive">*</span>
            </Label>
            <Select value={psId} onValueChange={setPsId} disabled={isLoading}>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
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
