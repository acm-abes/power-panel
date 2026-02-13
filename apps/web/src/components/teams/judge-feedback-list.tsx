/** @format */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface JudgeEvaluation {
  judgeName: string;
  submittedAt: Date;
  overallFeedback: string | null;
  extraPoints: number;
  extraJustification: string | null;
  scores: {
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string | null;
  }[];
  totalScore: number;
}

interface JudgeFeedbackListProps {
  evaluations: JudgeEvaluation[];
}

export function JudgeFeedbackList({ evaluations }: JudgeFeedbackListProps) {
  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No evaluations submitted yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Judge Feedback</CardTitle>
        <CardDescription>
          Detailed feedback from {evaluations.length} judge
          {evaluations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {evaluations.map((evaluation, idx) => (
            <AccordionItem key={idx} value={`judge-${idx}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {evaluation.judgeName}
                    </span>
                    <Badge variant="outline" className="font-mono">
                      Total: {evaluation.totalScore}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(evaluation.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* Criterion Scores */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Criterion Scores</h4>
                    <div className="grid gap-4">
                      {evaluation.scores.map((score, scoreIdx) => (
                        <div
                          key={scoreIdx}
                          className="border-l-2 border-primary pl-4 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium">
                              {score.criterion}
                            </span>
                            <Badge variant="secondary">
                              {score.score} / {score.maxScore}
                            </Badge>
                          </div>
                          {score.feedback && (
                            <p className="text-sm text-muted-foreground">
                              {score.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overall Feedback */}
                  {evaluation.overallFeedback && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">
                          Overall Feedback
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.overallFeedback}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Extra Points */}
                  {evaluation.extraPoints > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">
                            Bonus Points
                          </h4>
                          <Badge variant="default" className="bg-green-600">
                            +{evaluation.extraPoints}
                          </Badge>
                        </div>
                        {evaluation.extraJustification && (
                          <p className="text-sm text-muted-foreground">
                            {evaluation.extraJustification}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
