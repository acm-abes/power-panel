/** @format */

import { getAllSubmissions } from "@/actions/submissions";
import { getAllProblemStatements } from "@/actions/problem-statements";
import { Page, PageHeading, PageContent } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Lock, Unlock, Users, Calendar } from "lucide-react";
import { ToggleLockButton } from "./toggle-lock-button";

export default async function AdminSubmissionsPage() {
  const submissions = await getAllSubmissions();
  const problemStatements = await getAllProblemStatements();

  // Create a map for quick PS lookup
  const psMap = new Map(problemStatements.map((ps) => [ps.psId, ps]));

  const lockedCount = submissions.filter((s) => s.isLocked).length;
  const unlockedCount = submissions.filter((s) => !s.isLocked).length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Page>
      <PageHeading
        title="Submissions"
        badge={
          <Badge variant="outline">{submissions.length} submissions</Badge>
        }
      />
      <PageContent>
        <div className="mb-4 flex gap-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">
              Locked: {lockedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              Unlocked: {unlockedCount}
            </span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Team Submissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage all team submissions. Lock submissions to
                prevent further modifications after the deadline.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {submissions.map((submission) => (
                  <AccordionItem key={submission.id} value={submission.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <div className="shrink-0">
                          {submission.isLocked ? (
                            <Lock className="h-5 w-5 text-red-600" />
                          ) : (
                            <Unlock className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">
                            {submission.team.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">PS: {submission.psId}</Badge>
                          <Badge
                            variant={
                              submission.isLocked ? "destructive" : "default"
                            }
                          >
                            {submission.isLocked ? "Locked" : "Unlocked"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-8 pr-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Submission Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Problem Statement:
                                </span>{" "}
                                <div className="font-medium mt-1">
                                  <span className="text-primary">
                                    {submission.psId.toUpperCase()}
                                  </span>
                                  {psMap.get(submission.psId) && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {psMap.get(submission.psId)?.title}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Document:
                                </span>{" "}
                                <span className="font-medium">
                                  {submission.documentPath.split("/").pop()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  File Size:
                                </span>{" "}
                                <span className="font-medium">
                                  {formatFileSize(submission.documentSize)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Presentation:
                                </span>{" "}
                                <span className="font-medium">
                                  {submission.pptPath.split("/").pop()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  PPT Size:
                                </span>{" "}
                                <span className="font-medium">
                                  {formatFileSize(submission.pptSize)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Submitted:{" "}
                                  {new Date(
                                    submission.submittedAt,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Last Updated:{" "}
                                  {new Date(
                                    submission.updatedAt,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Team Members
                            </h4>
                            <div className="space-y-1">
                              {submission.team.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span>{member.user.name}</span>
                                  <Badge
                                    variant={
                                      member.role === "LEAD"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {member.role}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {submission.additionalNotes && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">
                              Additional Notes
                            </h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                              {submission.additionalNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <ToggleLockButton
                            submissionId={submission.id}
                            isLocked={submission.isLocked}
                            teamName={submission.team.name}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </Page>
  );
}
