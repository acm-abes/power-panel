/** @format */

"use client";

import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Submission = {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  psTitle: string;
  track: string;
  isLocked: boolean;
};

type SubmissionQueueProps = {
  submissions: Submission[];
};

function DraggableSubmissionCard({ submission }: { submission: Submission }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `submission-${submission.id}`,
      data: {
        type: "submission",
        id: submission.id,
        data: submission,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const trackColor =
    {
      AI: "bg-blue-500/10 text-blue-700 border-blue-300",
      Web3: "bg-purple-500/10 text-purple-700 border-purple-300",
      Defense: "bg-green-500/10 text-green-700 border-green-300",
    }[submission.track] || "bg-gray-500/10 text-gray-700 border-gray-300";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-move transition-all hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{submission.teamName}</p>
            <Badge variant="outline" className="text-xs shrink-0">
              {submission.teamCode}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {submission.psTitle}
          </p>

          <div className="mt-2">
            <Badge variant="outline" className={`text-xs ${trackColor}`}>
              {submission.track}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SubmissionQueue({ submissions }: SubmissionQueueProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      // Search filter
      const matchesSearch =
        submission.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.teamCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.psTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Track filter
      if (trackFilter === "all") return true;
      return submission.track === trackFilter;
    });
  }, [submissions, searchQuery, trackFilter]);

  const trackCounts = useMemo(() => {
    const counts = { AI: 0, Web3: 0, Defense: 0 };
    submissions.forEach((s) => {
      if (s.track in counts) {
        counts[s.track as keyof typeof counts]++;
      }
    });
    return counts;
  }, [submissions]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Submission Queue</h3>
        <p className="text-sm text-muted-foreground">
          {submissions.length} unassigned
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Tracks ({submissions.length})
            </SelectItem>
            <SelectItem value="AI">AI ({trackCounts.AI})</SelectItem>
            <SelectItem value="Web3">Web3 ({trackCounts.Web3})</SelectItem>
            <SelectItem value="Defense">
              Defense ({trackCounts.Defense})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Track Stats */}
      {trackFilter === "all" && submissions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            AI: {trackCounts.AI}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Web3: {trackCounts.Web3}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Defense: {trackCounts.Defense}
          </Badge>
        </div>
      )}

      {/* Submission Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredSubmissions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {searchQuery || trackFilter !== "all" ? (
              "No submissions match your filters"
            ) : (
              <div>
                <p className="mb-1">🎉 All submissions assigned!</p>
                <p className="text-xs">Great work!</p>
              </div>
            )}
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <DraggableSubmissionCard
              key={submission.id}
              submission={submission}
            />
          ))
        )}
      </div>
    </div>
  );
}
