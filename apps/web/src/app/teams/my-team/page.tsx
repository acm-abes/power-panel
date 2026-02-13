/** @format */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyTeam } from "@/actions/get-my-team";
import { getAllProblemStatements } from "@/actions/problem-statements";
import { getTeamAnalytics } from "@/actions/get-team-analytics";
import { Page, PageContent, PageHeading } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { headers } from "next/headers";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionDetails } from "@/components/submission-details";
import { TeamEvaluationsClient } from "@/components/teams/team-evaluations-client";

export default async function MyTeamPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const teamMembership = await getMyTeam();
  const problemStatements = await getAllProblemStatements();
  const team = teamMembership?.team;
  const analyticsMembers = team ? await getTeamAnalytics(team.teamCode) : [];

  if (!teamMembership || !team) {
    return (
      <Page>
        <PageHeading title="My Team" />
        <PageContent>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                You are not assigned to any team yet.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  // Calculate team statistics

  // Calculate team statistics
  const totalScore = team.evaluations.reduce((teamTotal, evaluation) => {
    const evaluationTotal = evaluation.scores.reduce(
      (sum, score) => sum + score.score,
      0,
    );
    return teamTotal + evaluationTotal + evaluation.extraPoints;
  }, 0);

  const averageScore =
    team.evaluations.length > 0 ? totalScore / team.evaluations.length : 0;

  return (
    <Page>
      <PageHeading title={team.name} />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Team Code / Team Id</h3>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-1.5 rounded-md text-lg font-mono font-semibold">
                    {team.teamCode}
                  </code>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Team Members</h3>
                {analyticsMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analyticsMembers.map((member) => {
                      const signedInMember = team.members.find(
                        (m) => m.user.email === member.userEmail,
                      );
                      const analyticMember = analyticsMembers.find(
                        (m) => m.userEmail === member.userEmail,
                      );

                      const isSignedIn = !!signedInMember;

                      return (
                        <div
                          key={member.id}
                          className={`flex flex-col p-3 rounded-lg border ${
                            isSignedIn
                              ? "bg-green-500/10 border-green-500/50"
                              : "bg-orange-500/10 border-orange-500/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm truncate pr-2">
                              {member.firstName} {member.lastName}
                            </span>
                            {isSignedIn ? (
                              <Badge
                                className="text-[10px] h-5 px-1.5"
                                variant={
                                  analyticMember?.position === "leader"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {analyticMember?.position.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 border-orange-500/50 text-orange-600 dark:text-orange-400"
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                          <span
                            className="text-xs text-muted-foreground truncate"
                            title={member.userEmail}
                          >
                            {member.userEmail}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <span>{member.user.name}</span>
                        <Badge
                          variant={
                            member.role === "LEAD" ? "default" : "secondary"
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Team Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="text-2xl font-bold">{team.members.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Evaluations Received
                    </p>
                    <p className="text-2xl font-bold">
                      {team.evaluations.length}
                    </p>
                  </div>
                  {team.evaluations.length > 0 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Average Score
                        </p>
                        <p className="text-2xl font-bold">
                          {averageScore.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Score
                        </p>
                        <p className="text-2xl font-bold">
                          {totalScore.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {team.submission ? (
          <SubmissionDetails
            submission={team.submission}
            problemStatements={problemStatements}
          />
        ) : (
          <SubmissionForm problemStatements={problemStatements} />
        )}

        {/* Evaluations with Radar Chart and Detailed Feedback */}
        <TeamEvaluationsClient teamId={team.id} />

        {team.mentorFeedbacks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mentor Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.mentorFeedbacks.map((feedback) => (
                  <Card key={feedback.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {feedback.mentor.name}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {feedback.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </Page>
  );
}

//         {team.evaluations.length > 0 && (
//           <Card>
//             <CardHeader>
//               <CardTitle>Evaluations</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {team.evaluations.map((evaluation) => {
//                   const evalTotal = evaluation.scores.reduce(
//                     (sum, score) => sum + score.score,
//                     0,
//                   );
//                   return (
//                     <Card key={evaluation.id}>
//                       <CardHeader>
//                         <div className="flex justify-between items-center">
//                           <CardTitle className="text-base">
//                             Judge: {evaluation.judge.name}
//                           </CardTitle>
//                           <Badge>
//                             Total: {evalTotal + evaluation.extraPoints}
//                           </Badge>
//                         </div>
//                       </CardHeader>
//                       <CardContent>
//                         <Table>
//                           <TableHeader>
//                             <TableRow>
//                               <TableHead>Criterion</TableHead>
//                               <TableHead className="text-right">
//                                 Score
//                               </TableHead>
//                             </TableRow>
//                           </TableHeader>
//                           <TableBody>
//                             {evaluation.scores.map((score) => (
//                               <TableRow key={score.id}>
//                                 <TableCell>
//                                   <div>
//                                     <p className="font-medium">
//                                       {score.criterion.subject}
//                                     </p>
//                                     <p className="text-sm text-muted-foreground">
//                                       {score.criterion.description}
//                                     </p>
//                                   </div>
//                                 </TableCell>
//                                 <TableCell className="text-right">
//                                   {score.score} / {score.criterion.fullMark}
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                             {evaluation.extraPoints !== 0 && (
//                               <TableRow>
//                                 <TableCell className="font-medium">
//                                   Extra Points
//                                 </TableCell>
//                                 <TableCell className="text-right font-medium">
//                                   {evaluation.extraPoints}
//                                 </TableCell>
//                               </TableRow>
//                             )}
//                           </TableBody>
//                         </Table>
//                         {evaluation.extraJustification && (
//                           <div className="mt-4">
//                             <p className="text-sm font-medium mb-1">
//                               Justification:
//                             </p>
//                             <p className="text-sm text-muted-foreground">
//                               {evaluation.extraJustification}
//                             </p>
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {team.mentorFeedbacks.length > 0 && (
//           <Card>
//             <CardHeader>
//               <CardTitle>Mentor Feedback</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {team.mentorFeedbacks.map((feedback) => (
//                   <Card key={feedback.id}>
//                     <CardHeader>
//                       <div className="flex justify-between items-center">
//                         <CardTitle className="text-base">
//                           {feedback.mentor.name}
//                         </CardTitle>
//                         <span className="text-sm text-muted-foreground">
//                           {new Date(feedback.createdAt).toLocaleDateString()}
//                         </span>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-sm">{feedback.content}</p>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </PageContent>
//     </Page>
//   );
// }
