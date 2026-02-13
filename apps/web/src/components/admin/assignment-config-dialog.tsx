/** @format */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Clock } from "lucide-react";
import { getSlotsAction } from "@/server/actions/admin-slots";
import { toast } from "sonner";

interface Slot {
  id: string;
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  slotOrder: number;
  _count: {
    panels: number;
    judgeAvailabilities: number;
  };
}

interface AssignmentConfigDialogProps {
  isLoading: boolean;
  disabled?: boolean;
  onGenerate: (config: {
    strategy: "better-panel-first" | "equal-distribution";
    slotFilter?: string;
  }) => void;
}

export function AssignmentConfigDialog({
  isLoading,
  disabled,
  onGenerate,
}: AssignmentConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");
  const [strategy, setStrategy] = useState<
    "better-panel-first" | "equal-distribution"
  >("better-panel-first");
  const [loadingSlots, setLoadingSlots] = useState(false);

  async function loadSlots() {
    setLoadingSlots(true);
    const result = await getSlotsAction();
    if (result.success && result.slots) {
      setSlots(result.slots);
    } else {
      toast.error(result.error || "Failed to load slots");
    }
    setLoadingSlots(false);
  }

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSlots();
    }
  }, [open]);

  function handleGenerate() {
    onGenerate({
      strategy,
      slotFilter: selectedSlotId === "all" ? undefined : selectedSlotId,
    });
    setOpen(false);
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isLoading || disabled}>
          <Users className=" h-4 w-4" />
          Preview Assignments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Configure Team Assignments</DialogTitle>
          <DialogDescription>
            Choose how submissions should be distributed across panels. You can
            review the results before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Slot Filter */}
          <div className="space-y-3">
            <Label htmlFor="slotFilter">Time Slot Filter (Optional)</Label>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : (
              <>
                <Select
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                >
                  <SelectTrigger id="slotFilter">
                    <SelectValue placeholder="All slots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span>All Slots</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        • Assign across all panels
                      </span>
                    </SelectItem>
                    {slots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        <div className="flex items-center gap-2">
                          <span>{slot.name}</span>
                          <span className="text-muted-foreground text-xs">
                            • Day {slot.day} • {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSlot && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selectedSlot._count.panels} panels in this slot
                    </span>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Select a specific slot to assign only to panels in that time slot,
              or choose &quot;All Slots&quot; to assign across all available
              panels.
            </p>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label>Distribution Strategy</Label>
            <RadioGroup
              value={strategy}
              onValueChange={(v: any) => setStrategy(v)}
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="better-panel-first"
                  id="better-panel-first"
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="better-panel-first"
                    className="font-medium cursor-pointer"
                  >
                    Better Panel First
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Fill the most compatible panels first before moving to
                    alternatives. This maximizes match quality but may create
                    uneven panel loads.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem
                  value="equal-distribution"
                  id="equal-distribution"
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="equal-distribution"
                    className="font-medium cursor-pointer"
                  >
                    Equal Distribution
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Distribute submissions evenly across all panels to balance
                    workload. Specialized panels are prioritized over mixed
                    panels.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>Generate Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
