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

  const trackStyles = {
    AI: {
      bg: "bg-gradient-to-br",
      border: "border-l-4 border-l-blue-500",
      badge: "bg-blue-100 text-blue-700 border-blue-300",
    },
    Web3: {
      bg: "bg-gradient-to-br",
      border: "border-l-4 border-l-purple-500",
      badge: "bg-purple-100 text-purple-700 border-purple-300",
    },
    Defense: {
      bg: "bg-gradient-to-br",
      border: "border-l-4 border-l-green-500",
      badge: "bg-green-100 text-green-700 border-green-300",
    },
  }[submission.track as "AI" | "Web3" | "Defense"] || {
    bg: "bg-gradient-to-br from-gray-50 to-gray-100",
    border: "border-l-4 border-l-gray-500",
    badge: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all cursor-move border-2 ${
        trackStyles.bg
      } ${trackStyles.border} hover:shadow-lg ${
        isDragging ? "opacity-50 scale-105 shadow-xl rotate-2" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/50 transition-colors"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate text-base">
              {submission.teamName}
            </p>
            <Badge variant="outline" className="text-xs shrink-0">
              {submission.teamCode}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {submission.psTitle}
          </p>

          <div>
            <Badge className={`text-xs font-medium ${trackStyles.badge}`}>
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
    <div className="flex max-h-180 flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Submission Queue</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-orange-600">
            {submissions.length} unassigned
          </span>
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2 h-200">
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
