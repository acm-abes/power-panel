/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { submitEvaluationAction } from "@/server/actions/judge-evaluation";

interface TeamData {
  id: string;
  name: string;
  teamCode: string;
  members: { name: string; email: string }[];
  submission: {
    id: string;
    problemStatement: {
      title: string;
      track: string;
      content: string;
    };
    documentPath: string;
    pptPath: string;
  } | null;
}

interface Criterion {
  id: string;
  key: string;
  subject: string;
  description: string;
  fullMark: number;
  order: number;
}

interface ExistingEvaluation {
  id: string;
  submittedAt: Date | null;
  overallFeedback: string | null;
  extraPoints: number;
  extraJustification: string | null;
  scores: {
    criterionId: string;
    score: number;
    feedback: string | null;
  }[];
}

interface EvaluationFormProps {
  team: TeamData;
  criteria: Criterion[];
  existingEvaluation: ExistingEvaluation | null;
  slotId: string;
}

export function EvaluationForm({
  team,
  criteria,
  existingEvaluation,
  slotId,
}: EvaluationFormProps) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [extraPoints, setExtraPoints] = useState(0);
  const [extraJustification, setExtraJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load existing evaluation data
  useEffect(() => {
    if (existingEvaluation) {
      const scoresMap: Record<string, number> = {};
      const feedbacksMap: Record<string, string> = {};

      existingEvaluation.scores.forEach((s) => {
        scoresMap[s.criterionId] = s.score;
        if (s.feedback) {
          feedbacksMap[s.criterionId] = s.feedback;
        }
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScores(scoresMap);
      setFeedbacks(feedbacksMap);
      setOverallFeedback(existingEvaluation.overallFeedback || "");
      setExtraPoints(existingEvaluation.extraPoints || 0);
      setExtraJustification(existingEvaluation.extraJustification || "");
      setIsSubmitted(!!existingEvaluation.submittedAt);
    }
  }, [existingEvaluation]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (Object.keys(scores).length > 0 || overallFeedback) {
      const draftKey = `eval-draft-${team.id}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          scores,
          feedbacks,
          overallFeedback,
          extraPoints,
          extraJustification,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }, [
    scores,
    feedbacks,
    overallFeedback,
    extraPoints,
    extraJustification,
    team.id,
  ]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!existingEvaluation) {
      const draftKey = `eval-draft-${team.id}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setScores(parsed.scores || {});
          setFeedbacks(parsed.feedbacks || {});
          setOverallFeedback(parsed.overallFeedback || "");
          setExtraPoints(parsed.extraPoints || 0);
          setExtraJustification(parsed.extraJustification || "");
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
      }
    }
  }, [team.id, existingEvaluation]);

  const handleScoreChange = (criterionId: string, value: number[]) => {
    setScores((prev) => ({ ...prev, [criterionId]: value[0] }));
  };

  const handleScoreInputChange = (criterionId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(100, numValue));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  const handleFeedbackChange = (criterionId: string, value: string) => {
    setFeedbacks((prev) => ({ ...prev, [criterionId]: value }));
  };

  const validateForm = (isDraft: boolean): string | null => {
    // Check if all criteria have scores
    const missingScores = criteria.filter((c) => scores[c.id] === undefined);
    if (missingScores.length > 0) {
      return `Please provide scores for: ${missingScores.map((c) => c.subject).join(", ")}`;
    }

    // For submission (not draft), require overall feedback
    if (!isDraft && !overallFeedback.trim()) {
      return "Overall feedback is required for submission";
    }

    // If extra points given, require justification
    if (extraPoints > 0 && !extraJustification.trim()) {
      return "Please provide justification for extra points";
    }

    return null;
  };

  const handleSaveDraft = async () => {
    const error = validateForm(true);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    const result = await submitEvaluationAction({
      teamId: team.id,
      slotId,
      scores: criteria.map((c) => ({
        criterionId: c.id,
        score: scores[c.id] || 0,
        feedback: feedbacks[c.id] || undefined,
      })),
      overallFeedback,
      extraPoints,
      extraJustification: extraJustification || undefined,
      isDraft: true,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      // Clear localStorage draft
      localStorage.removeItem(`eval-draft-${team.id}`);
    } else {
      toast.error(result.error || "Failed to save draft");
    }
  };

  const handleSubmit = async () => {
    const error = validateForm(false);
    if (error) {
      toast.error(error);
      setShowSubmitDialog(false);
      return;
    }

    setIsSubmitting(true);
    const result = await submitEvaluationAction({
      teamId: team.id,
      slotId,
      scores: criteria.map((c) => ({
        criterionId: c.id,
        score: scores[c.id] || 0,
        feedback: feedbacks[c.id] || undefined,
      })),
      overallFeedback,
      extraPoints,
      extraJustification: extraJustification || undefined,
      isDraft: false,
    });

    setIsSubmitting(false);
    setShowSubmitDialog(false);

    if (result.success) {
      toast.success(result.message);
      setIsSubmitted(true);
      // Clear localStorage draft
      localStorage.removeItem(`eval-draft-${team.id}`);
      // Redirect to evaluation dashboard
      setTimeout(() => router.push("/judges/evaluate"), 1500);
    } else {
      toast.error(result.error || "Failed to submit evaluation");
    }
  };

  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0,
  );
  const totalWithExtra = totalScore + extraPoints;
  const maxScore = criteria.reduce((sum, c) => sum + c.fullMark, 0);

  return (
    <div className="space-y-6">
      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Team Name</Label>
              <p className="font-medium">{team.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Team Code</Label>
              <p className="font-medium font-mono">{team.teamCode}</p>
            </div>
          </div>

          {team.submission && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Problem Statement
                </Label>
                <p className="font-medium">
                  {team.submission.problemStatement.title}
                </p>
                <Badge variant="secondary">
                  {team.submission.problemStatement.track}
                </Badge>
                {team.submission.problemStatement.content && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: team.submission.problemStatement.content,
                    }}
                  />
                )}
              </div>
            </>
          )}

          <Separator />
          <div>
            <Label className="text-muted-foreground flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Team Members
            </Label>
            <div className="space-y-1">
              {team.members.map((member, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground ml-2">
                    ({member.email})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* {team.submission && (
            <>
              <Separator />
              <div className="flex gap-4">
                {team.submission.documentPath && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={team.submission.documentPath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className=" h-4 w-4" />
                      View Document
                    </a>
                  </Button>
                )}
                {team.submission.pptPath && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={team.submission.pptPath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className=" h-4 w-4" />
                      View Presentation
                    </a>
                  </Button>
                )}
              </div>
            </>
          )} */}
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <Label className="text-muted-foreground">Criteria Score</Label>
              <div className="text-3xl font-bold mt-1">
                {totalScore} / {maxScore}
              </div>
            </div>
            <div className="text-center">
              <Label className="text-muted-foreground">Extra Points</Label>
              <div className="text-3xl font-bold mt-1 text-green-600">
                +{extraPoints}
              </div>
            </div>
            <div className="text-center">
              <Label className="text-muted-foreground">Total Score</Label>
              <div className="text-4xl font-bold mt-1 text-primary">
                {totalWithExtra}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Criteria */}
      {criteria.map((criterion, idx) => (
        <Card key={criterion.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">
                    #{idx + 1}
                  </span>
                  {criterion.subject}
                </CardTitle>
                <CardDescription>{criterion.description}</CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-lg font-semibold px-4 py-1"
              >
                {scores[criterion.id] || 0} / {criterion.fullMark}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Score</Label>
                <Input
                  type="number"
                  min="0"
                  max={criterion.fullMark}
                  value={scores[criterion.id] || 0}
                  onChange={(e) =>
                    handleScoreInputChange(criterion.id, e.target.value)
                  }
                  className="w-20 text-center"
                  disabled={isSubmitted}
                />
              </div>
              <Slider
                min={0}
                max={criterion.fullMark}
                step={1}
                value={[scores[criterion.id] || 0]}
                onValueChange={(value) =>
                  handleScoreChange(criterion.id, value)
                }
                className="w-full"
                disabled={isSubmitted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`feedback-${criterion.id}`}>
                Feedback{" "}
                <span className="text-muted-foreground text-sm">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id={`feedback-${criterion.id}`}
                placeholder={`Explain your score for ${criterion.subject}...`}
                value={feedbacks[criterion.id] || ""}
                onChange={(e) =>
                  handleFeedbackChange(criterion.id, e.target.value)
                }
                rows={3}
                disabled={isSubmitted}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Overall Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
          <CardDescription>
            Provide comprehensive feedback on the team&apos;s overall
            performance
            {!isSubmitted && (
              <span className="text-destructive"> (Required)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your overall feedback here..."
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            rows={6}
            disabled={isSubmitted}
          />
        </CardContent>
      </Card>

      {/* Extra Points */}
      <Card>
        <CardHeader>
          <CardTitle>Bonus Points</CardTitle>
          <CardDescription>
            Award additional points for exceptional aspects beyond the criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="extra-points">Extra Points</Label>
            <Input
              id="extra-points"
              type="number"
              min="0"
              value={extraPoints}
              onChange={(e) => setExtraPoints(parseInt(e.target.value) || 0)}
              placeholder="0"
              disabled={isSubmitted}
            />
          </div>

          {extraPoints > 0 && (
            <div className="space-y-2">
              <Label htmlFor="extra-justification">
                Justification{" "}
                <span className="text-destructive">(Required)</span>
              </Label>
              <Textarea
                id="extra-justification"
                placeholder="Explain why you're awarding these extra points..."
                value={extraJustification}
                onChange={(e) => setExtraJustification(e.target.value)}
                rows={4}
                disabled={isSubmitted}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="flex justify-end gap-4 sticky bottom-4 bg-background/95 backdrop-blur p-4 border rounded-lg shadow-lg">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className=" h-4 w-4 animate-spin" />
            ) : (
              <Save className=" h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className=" h-4 w-4 animate-spin" />
            ) : (
              <Send className=" h-4 w-4" />
            )}
            Submit Evaluation
          </Button>
        </div>
      )}

      {isSubmitted && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="py-6 text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">
              ✓ This evaluation has been submitted
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Evaluation?</AlertDialogTitle>
            <div>
              Once submitted, you will not be able to edit this evaluation.
              Please ensure all scores and feedback are accurate.
              <p className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-medium">
                  Final Score: {totalWithExtra} points
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ({totalScore} from criteria + {extraPoints} bonus)
                </p>
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className=" h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm & Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
