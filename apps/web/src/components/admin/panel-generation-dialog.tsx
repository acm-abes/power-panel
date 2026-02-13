/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Clock, Users } from "lucide-react";
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

interface PanelGenerationDialogProps {
  isLoading: boolean;
  onGenerate: (config: {
    strategy: "fresh" | "unallocated";
    judgesPerPanel: number;
    capacity: number;
    slotId: string;
  }) => void;
}

export function PanelGenerationDialog({
  isLoading,
  onGenerate,
}: PanelGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [strategy, setStrategy] = useState<"fresh" | "unallocated">(
    "unallocated",
  );
  const [judgesPerPanel, setJudgesPerPanel] = useState(3);
  const [capacity, setCapacity] = useState(5);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    const result = await getSlotsAction();
    if (result.success && result.slots) {
      setSlots(result.slots);
      // Auto-select first slot if available
      if (result.slots.length > 0 && !selectedSlotId) {
        setSelectedSlotId(result.slots[0].id);
      }
    } else {
      toast.error(result.error || "Failed to load slots");
    }
    setLoadingSlots(false);
  }, [selectedSlotId]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSlots();
    }
  }, [loadSlots, open]);

  function handleGenerate() {
    if (!selectedSlotId) {
      toast.error("Please select a time slot");
      return;
    }

    onGenerate({ strategy, judgesPerPanel, capacity, slotId: selectedSlotId });
    setOpen(false);
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isLoading}>
          <Wand2 className=" h-4 w-4" />
          Auto-Generate Panels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Generate Judge Panels</DialogTitle>
          <DialogDescription>
            Configure how the system should create panels. You can review the
            results before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Slot Selection */}
          <div className="space-y-3">
            <Label htmlFor="slot">Evaluation Time Slot *</Label>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : slots.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No evaluation slots available. Please create slots first.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin/panels/slots">Create Slots</a>
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                >
                  <SelectTrigger id="slot">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {selectedSlot._count.judgeAvailabilities} judges
                        available
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {selectedSlot._count.panels} existing panels
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label>Allocation Strategy</Label>
            <RadioGroup
              value={strategy}
              onValueChange={(v: any) => setStrategy(v)}
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="unallocated" id="unallocated" />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="unallocated"
                    className="font-medium cursor-pointer"
                  >
                    Unallocated Judges Only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Create new panels using only judges in this slot who
                    aren&apos;t currently assigned. Existing panels remain
                    unchanged.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="fresh" id="fresh" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="fresh" className="font-medium cursor-pointer">
                    Fresh Start
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Clear all existing panels for this slot and redistribute all
                    available judges into new balanced panels.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="judgesPerPanel">Judges per Panel</Label>
              <Input
                id="judgesPerPanel"
                type="number"
                min={2}
                max={10}
                value={judgesPerPanel}
                onChange={(e) =>
                  setJudgesPerPanel(parseInt(e.target.value) || 3)
                }
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 3-5 judges
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Submissions</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Per panel capacity
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedSlotId || slots.length === 0}
          >
            Generate Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
