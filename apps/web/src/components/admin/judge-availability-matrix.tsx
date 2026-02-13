/** @format */

"use client";

import { useEffect, useState } from "react";
import {
  getAvailabilityMatrixAction,
  toggleJudgeAvailabilityAction,
  bulkSetAvailabilityAction,
  clearJudgeAvailabilityAction,
} from "@/server/actions/admin-availability";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckSquare, XSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Judge {
  id: string;
  name: string;
  email: string;
  judgeAvailabilities: { slotId: string }[];
}

interface Slot {
  id: string;
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  slotOrder: number;
}

export function JudgeAvailabilityMatrix() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [judgeToClear, setJudgeToClear] = useState<Judge | null>(null);

  // Track availability state locally for optimistic updates
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<string, Set<string>>
  >({});

  const loadData = async () => {
    setLoading(true);
    const result = await getAvailabilityMatrixAction();
    if (result.success && result.judges && result.slots) {
      setJudges(result.judges);
      setSlots(result.slots);

      // Build availability map
      const map: Record<string, Set<string>> = {};
      result.judges.forEach((judge) => {
        map[judge.id] = new Set(judge.judgeAvailabilities.map((a) => a.slotId));
      });
      setAvailabilityMap(map);
    } else {
      toast.error(result.error || "Failed to load availability data");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const isAvailable = (judgeId: string, slotId: string) => {
    return availabilityMap[judgeId]?.has(slotId) || false;
  };

  const handleToggle = async (judgeId: string, slotId: string) => {
    const currentlyAvailable = isAvailable(judgeId, slotId);
    const newAvailability = !currentlyAvailable;

    // Optimistic update
    setAvailabilityMap((prev) => {
      const newMap = { ...prev };
      if (!newMap[judgeId]) {
        newMap[judgeId] = new Set();
      }
      if (newAvailability) {
        newMap[judgeId].add(slotId);
      } else {
        newMap[judgeId].delete(slotId);
      }
      return newMap;
    });

    const result = await toggleJudgeAvailabilityAction(
      judgeId,
      slotId,
      newAvailability,
    );

    if (!result.success) {
      // Revert on error
      setAvailabilityMap((prev) => {
        const newMap = { ...prev };
        if (currentlyAvailable) {
          newMap[judgeId].add(slotId);
        } else {
          newMap[judgeId].delete(slotId);
        }
        return newMap;
      });

      toast.error(result.error || "Failed to update availability");
    }
  };

  const handleBulkSetForSlot = async (slotId: string, isAvailable: boolean) => {
    const judgeIds = judges.map((j) => j.id);
    const result = await bulkSetAvailabilityAction(
      judgeIds,
      slotId,
      isAvailable,
    );

    if (result.success) {
      toast.success(
        `All judges ${isAvailable ? "marked available" : "removed"} for this slot`,
      );
      loadData();
    } else {
      toast.error(result.error || "Failed to update availability");
    }
  };

  const handleClearJudge = async () => {
    if (!judgeToClear) return;

    const result = await clearJudgeAvailabilityAction(judgeToClear.id);

    if (result.success) {
      toast.success("Judge availability cleared");
      loadData();
    } else {
      toast.error(result.error || "Failed to clear availability");
    }

    setClearDialogOpen(false);
    setJudgeToClear(null);
  };

  const getJudgeAvailabilityCount = (judgeId: string) => {
    return availabilityMap[judgeId]?.size || 0;
  };

  const getSlotAvailabilityCount = (slotId: string) => {
    return judges.filter((judge) => isAvailable(judge.id, slotId)).length;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading availability matrix...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Slots Available</h3>
        <p className="text-muted-foreground mb-4">
          Please create evaluation slots first before managing judge
          availability.
        </p>
        <Button asChild>
          <a href="/admin/panels/slots">Create Slots</a>
        </Button>
      </div>
    );
  }

  if (judges.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Judges Found</h3>
        <p className="text-muted-foreground">
          No users with the JUDGE role found in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Availability Matrix
          </h2>
          <p className="text-muted-foreground">
            {judges.length} judges across {slots.length} time slots
          </p>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-62.5 sticky left-0 bg-background z-10">
                Judge
              </TableHead>
              {slots.map((slot) => (
                <TableHead key={slot.id} className="text-center min-w-37.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="font-semibold">{slot.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Day {slot.day} • {formatTime(slot.startTime)} -{" "}
                      {formatTime(slot.endTime)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getSlotAvailabilityCount(slot.id)} available
                    </Badge>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleBulkSetForSlot(slot.id, true)}
                      >
                        <CheckSquare className="h-3 w-3 mr-1" />
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleBulkSetForSlot(slot.id, false)}
                      >
                        <XSquare className="h-3 w-3 mr-1" />
                        None
                      </Button>
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="font-semibold">Total</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {judges.map((judge) => (
              <TableRow key={judge.id}>
                <TableCell className="sticky left-0 bg-background z-10">
                  <div className="flex flex-col">
                    <div className="font-medium">{judge.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {judge.email}
                    </div>
                  </div>
                </TableCell>
                {slots.map((slot) => (
                  <TableCell key={slot.id} className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={isAvailable(judge.id, slot.id)}
                        onCheckedChange={() => handleToggle(judge.id, slot.id)}
                        className="h-5 w-5"
                      />
                    </div>
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="outline">
                      {getJudgeAvailabilityCount(judge.id)} / {slots.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        setJudgeToClear(judge);
                        setClearDialogOpen(true);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Judge Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all availability for{" "}
              {judgeToClear?.name}? This will remove them from all time slots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJudgeToClear(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleClearJudge}>
              Clear Availability
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
