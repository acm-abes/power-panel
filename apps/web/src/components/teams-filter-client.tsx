/** @format */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  Search,
} from "lucide-react";

type FilterType =
  | "all"
  | "complete"
  | "incomplete"
  | "partial"
  | "invalid-size";

type Team = {
  id: string;
  name: string;
  status: "complete" | "partial" | "incomplete";
  members: Array<{
    id: string;
    userEmail: string;
    userName?: string;
    hasSignedIn: boolean;
  }>;
};

interface TeamsFilterClientProps {
  teams: Team[];
}

export function TeamsFilterClient({ teams }: TeamsFilterClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Apply filters and search with useMemo for performance
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      // Apply status filter
      if (filter === "complete" && team.status !== "complete") return false;
      if (filter === "incomplete" && team.status !== "incomplete") return false;
      if (filter === "partial" && team.status !== "partial") return false;
      if (
        filter === "invalid-size" &&
        team.members.length >= 2 &&
        team.members.length <= 4
      )
        return false;

      // Apply search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTeamName = team.name.toLowerCase().includes(query);
        const matchesMemberEmail = team.members.some((member) =>
          member.userEmail.toLowerCase().includes(query),
        );
        return matchesTeamName || matchesMemberEmail;
      }

      return true;
    });
  }, [teams, filter, searchQuery]);

  const completeTeams = useMemo(
    () => filteredTeams.filter((t) => t.status === "complete").length,
    [filteredTeams],
  );
  const partialTeams = useMemo(
    () => filteredTeams.filter((t) => t.status === "partial").length,
    [filteredTeams],
  );
  const incompleteTeams = useMemo(
    () => filteredTeams.filter((t) => t.status === "incomplete").length,
    [filteredTeams],
  );

  return (
    <>
      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by team name or member email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Teams ({teams.length})
        </Button>
        <Button
          variant={filter === "complete" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("complete")}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Complete ({teams.filter((t) => t.status === "complete").length})
        </Button>
        <Button
          variant={filter === "partial" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("partial")}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Partial ({teams.filter((t) => t.status === "partial").length})
        </Button>
        <Button
          variant={filter === "incomplete" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("incomplete")}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Incomplete ({teams.filter((t) => t.status === "incomplete").length})
        </Button>
        <Button
          variant={filter === "invalid-size" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("invalid-size")}
        >
          Invalid Size (
          {
            teams.filter((t) => t.members.length < 2 || t.members.length > 4)
              .length
          }
          )
        </Button>
      </div>

      {/* Stats Summary */}
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
            have signed in, yellow indicates partial sign-ups, and red indicates
            teams with invalid member counts or no sign-ups.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {filteredTeams.map((team) => (
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
                            <Badge variant="outline" className="text-gray-600">
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
          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery.trim() || filter !== "all"
                ? "No teams match your filters"
                : "No pending teams found"}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
