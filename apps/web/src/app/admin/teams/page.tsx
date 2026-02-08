/** @format */

import { getPendingTeams } from "@/actions/get-pending-teams";
import { Page, PageHeading, PageContent } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, AlertCircle, XCircle, UserCheck } from "lucide-react";

export default async function PendingTeamsPage() {
  const teams = await getPendingTeams();

  const completeTeams = teams.filter((t) => t.status === "complete").length;
  const partialTeams = teams.filter((t) => t.status === "partial").length;
  const incompleteTeams = teams.filter((t) => t.status === "incomplete").length;

  return (
    <Page>
      <PageHeading
        title="Pending Teams"
        badge={<Badge variant="outline">{teams.length} teams</Badge>}
      />
      <PageContent>
        <div className="mb-4 flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              Complete: {completeTeams}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground">
              Partial: {partialTeams}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">
              Incomplete: {incompleteTeams}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expected Teams from External Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Teams and members expected to sign up. Green indicates all members
              have signed in, yellow indicates partial sign-ups, and red
              indicates teams with invalid member counts or no sign-ups.
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {teams.map((team) => (
                <AccordionItem key={team.id} value={team.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <div className="shrink-0">
                        {team.status === "complete" && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {team.status === "partial" && (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        {team.status === "incomplete" && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{team.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {team.members.filter((m) => m.hasSignedIn).length}/
                          {team.members.length} signed in
                        </Badge>
                        {team.members.length < 2 || team.members.length > 4 ? (
                          <Badge variant="destructive">
                            {team.members.length} members
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 pr-4 space-y-1">
                      {team.members.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">
                          No members found
                        </div>
                      ) : (
                        team.members.map((member) => (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-3 border-l-5 transition-colors ${
                              member.hasSignedIn
                                ? "bg-green-50/10 border-green-200 border-y border-r"
                                : "bg-gray-50/10 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {member.hasSignedIn && (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                              <div>
                                {member.hasSignedIn && member.userName ? (
                                  <>
                                    <div className="font-medium">
                                      {member.userName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {member.userEmail}
                                    </div>
                                  </>
                                ) : (
                                  <div className="font-medium">
                                    {member.userEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                            {member.hasSignedIn ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700 border-green-300"
                              >
                                Signed In
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-gray-600"
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {teams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending teams found
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
