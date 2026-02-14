/** @format */

"use client";

import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, GripVertical, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Judge = {
  id: string;
  name: string;
  email: string;
  trackPreferences: { AI: number; Web3: number; Defense: number };
  inPanelId?: string;
  inPanelName?: string;
};

type JudgePoolProps = {
  judges: Judge[];
  selectedSlotId?: string;
};

function DraggableJudgeCard({ judge }: { judge: Judge }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `judge-${judge.id}`,
      data: {
        type: "judge",
        id: judge.id,
        data: judge,
      },
      disabled: !!judge.inPanelId,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isAssigned = !!judge.inPanelId;

  // Get the top track preference
  const topTrack =
    (Object.entries(judge.trackPreferences).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0] as "AI" | "Web3" | "Defense") || "AI";

  const trackColors = {
    AI: "from-blue-500/10 to-blue-600/5 border-blue-200",
    Web3: "from-purple-500/10 to-purple-600/5 border-purple-200",
    Defense: "from-green-500/10 to-green-600/5 border-green-200",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all border-2 ${
        isDragging ? "opacity-50 scale-105 shadow-xl" : ""
      } ${
        isAssigned
          ? "cursor-not-allowed opacity-60 bg-muted/50"
          : `cursor-move hover:shadow-lg bg-linear-to-br ${trackColors[topTrack]}`
      }`}
    >
      <div className="flex items-start gap-3">
        {!isAssigned && (
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate text-base">{judge.name}</p>
            {isAssigned && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate mb-3">
            {judge.email}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {judge.trackPreferences.AI > 0 && (
              <Badge className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300">
                AI: {judge.trackPreferences.AI}
              </Badge>
            )}
            {judge.trackPreferences.Web3 > 0 && (
              <Badge className="text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300">
                Web3: {judge.trackPreferences.Web3}
              </Badge>
            )}
            {judge.trackPreferences.Defense > 0 && (
              <Badge className="text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
                Defense: {judge.trackPreferences.Defense}
              </Badge>
            )}
          </div>

          {isAssigned && (
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Assigned to:{" "}
                <span className="font-semibold text-foreground">
                  {judge.inPanelName}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function JudgePool({ judges }: JudgePoolProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const filteredJudges = useMemo(() => {
    return judges.filter((judge) => {
      // Search filter
      const matchesSearch =
        judge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        judge.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Track filter
      if (trackFilter === "all") return true;

      const trackPref = judge.trackPreferences[
        trackFilter as keyof typeof judge.trackPreferences
      ] as number;
      return trackPref > 0;
    });
  }, [judges, searchQuery, trackFilter]);

  const stats = useMemo(() => {
    const available = judges.filter((j) => !j.inPanelId).length;
    const assigned = judges.filter((j) => j.inPanelId).length;
    return { available, assigned, total: judges.length };
  }, [judges]);

  return (
    <div className="flex max-h-180 flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Judge Pool</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-green-600">
            {stats.available} available
          </span>{" "}
          · {stats.assigned} assigned
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search judges..."
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
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="AI">AI</SelectItem>
            <SelectItem value="Web3">Web3</SelectItem>
            <SelectItem value="Defense">Defense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Judge Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
        {filteredJudges.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {searchQuery || trackFilter !== "all"
              ? "No judges match your filters"
              : "No judges available for this slot"}
          </div>
        ) : (
          filteredJudges.map((judge) => (
            <DraggableJudgeCard key={judge.id} judge={judge} />
          ))
        )}
      </div>
    </div>
  );
}
