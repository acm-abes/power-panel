/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Page, PageHeading, PageContent } from "@/components/page";

async function submitFeedback(formData: FormData) {
  "use server";
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const teamId = formData.get("teamId") as string;
  const content = formData.get("content") as string;

  if (!content || content.trim() === "") {
    return;
  }

  await prisma.mentorFeedback.create({
    data: {
      mentorId: session.user.id,
      teamId,
      content,
    },
  });

  // Revalidate the page
  redirect("/mentors/feedback");
}

export default async function MentorFeedbackPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const teams = await prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const previousFeedback = await prisma.mentorFeedback.findMany({
    where: {
      mentorId: session.user.id,
    },
    include: {
      team: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <Page>
      <PageHeading
        title="Give Feedback"
        description="Share your insights with the teams"
      />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {teams.length === 0 ? (
                <p className="text-muted-foreground">No teams available</p>
              ) : (
                teams.map((team) => (
                  <Card key={team.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {team.name}
                          </CardTitle>
                          {team.track && (
                            <Badge variant="outline" className="mt-1">
                              {team.track}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                          Team Members:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((member) => (
                            <Badge key={member.id} variant="secondary">
                              {member.user.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <form action={submitFeedback}>
                        <input type="hidden" name="teamId" value={team.id} />
                        <div className="space-y-2">
                          <Label htmlFor={`feedback-${team.id}`}>
                            Your Feedback
                          </Label>
                          <Textarea
                            id={`feedback-${team.id}`}
                            name="content"
                            placeholder="Share your feedback for this team..."
                            rows={4}
                            required
                          />
                        </div>
                        <Button type="submit" className="mt-4">
                          Submit Feedback
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {previousFeedback.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Previous Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousFeedback.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">
                        {feedback.team.name}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm line-clamp-3">
                          {feedback.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </Page>
  );
}
