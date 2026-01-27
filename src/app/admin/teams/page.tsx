/** @format */

import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Page, PageHeading, PageContent } from "@/components/page";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <Page>
      <PageHeading
        title="Teams"
        badge={<Badge variant="outline">{teams.length}</Badge>}
      />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No teams found
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.track ? (
                          <Badge variant="outline">{team.track}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {team.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm">
                                {member.user.name}
                              </span>
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
                          {team.members.length === 0 && (
                            <span className="text-sm text-muted-foreground">
                              No members
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(team.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
