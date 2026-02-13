/** @format */

import { prisma } from "@power/db";
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
import { Button } from "@/components/ui/button";
import { Page, PageHeading, PageContent } from "@/components/page";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default async function JudgesPage() {
  const judges = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: "JUDGE",
          },
        },
      },
    },
    include: {
      judgeAssignments: {
        include: {
          team: true,
        },
      },
      evaluations: {
        include: {
          team: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <Page>
      <div className="flex items-center justify-between">
        <PageHeading
          title="Judges"
          badge={<Badge variant="outline">{judges.length}</Badge>}
        />
        <Link href="/admin/judges/availability">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Manage Availability
          </Button>
        </Link>
      </div>
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>All Judges</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Teams</TableHead>
                  <TableHead>Evaluations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No judges found
                    </TableCell>
                  </TableRow>
                ) : (
                  judges.map((judge) => (
                    <TableRow key={judge.id}>
                      <TableCell className="font-medium">
                        {judge.name}
                      </TableCell>
                      <TableCell>{judge.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {judge.judgeAssignments.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              No assignments
                            </span>
                          ) : (
                            judge.judgeAssignments.map((assignment) => (
                              <span key={assignment.id} className="text-sm">
                                {assignment.team.name}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {
                              judge.evaluations.filter((e) => e.submittedAt)
                                .length
                            }{" "}
                            / {judge.judgeAssignments.length}
                          </Badge>
                          {judge.evaluations.filter((e) => e.submittedAt)
                            .length === judge.judgeAssignments.length &&
                            judge.judgeAssignments.length > 0 && (
                              <Badge variant="default">Complete</Badge>
                            )}
                        </div>
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
