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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 transition-all ${
        isDragging ? "opacity-50" : ""
      } ${isAssigned ? "cursor-not-allowed opacity-60" : "cursor-move hover:shadow-md"}`}
    >
      <div className="flex items-start gap-2">
        {!isAssigned && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{judge.name}</p>
            {isAssigned && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {judge.email}
          </p>

          <div className="mt-2 flex flex-wrap gap-1">
            {judge.trackPreferences.AI > 0 && (
              <Badge variant="secondary" className="text-xs">
                AI: {judge.trackPreferences.AI}
              </Badge>
            )}
            {judge.trackPreferences.Web3 > 0 && (
              <Badge variant="secondary" className="text-xs">
                Web3: {judge.trackPreferences.Web3}
              </Badge>
            )}
            {judge.trackPreferences.Defense > 0 && (
              <Badge variant="secondary" className="text-xs">
                Defense: {judge.trackPreferences.Defense}
              </Badge>
            )}
          </div>

          {isAssigned && (
            <p className="mt-2 text-xs text-muted-foreground">
              In: <span className="font-medium">{judge.inPanelName}</span>
            </p>
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
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Judge Pool</h3>
        <p className="text-sm text-muted-foreground">
          {stats.available} available · {stats.assigned} assigned
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
      <div className="flex-1 space-y-2 overflow-y-auto">
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
