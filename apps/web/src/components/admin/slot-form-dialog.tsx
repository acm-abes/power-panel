/** @format */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSlotAction,
  updateSlotAction,
} from "@/server/actions/admin-slots";
import { toast } from "sonner";

interface EvaluationSlot {
  id: string;
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  slotOrder: number;
}

interface SlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: EvaluationSlot | null;
}

export function SlotFormDialog({
  open,
  onOpenChange,
  slot,
}: SlotFormDialogProps) {
  const [name, setName] = useState("");
  const [day, setDay] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [slotOrder, setSlotOrder] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (slot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(slot.name);
      setDay(slot.day.toString());
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setSlotOrder(slot.slotOrder.toString());
    } else {
      // Reset to defaults
      setName("");
      setDay("1");
      setStartTime("09:00");
      setEndTime("11:00");
      setSlotOrder("1");
    }
  }, [slot, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name,
      day: parseInt(day),
      startTime,
      endTime,
      slotOrder: parseInt(slotOrder),
    };

    const result = slot
      ? await updateSlotAction(slot.id, data)
      : await createSlotAction(data);

    if (result.success) {
      toast.success(
        slot ? "Slot updated successfully" : "Slot created successfully",
      );
      onOpenChange(true); // true to trigger refresh
    } else {
      toast.error(result.error || "Failed to save slot");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{slot ? "Edit Slot" : "Create New Slot"}</DialogTitle>
            <DialogDescription>
              {slot
                ? "Update the evaluation slot details"
                : "Create a new time slot for panel evaluations"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Slot Name</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Session Day 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="day">Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        Day {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slotOrder">Slot Order</Label>
                <Select value={slotOrder} onValueChange={setSlotOrder}>
                  <SelectTrigger id="slotOrder">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((o) => (
                      <SelectItem key={o} value={o.toString()}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Slots are ordered by day, then by slot order within each day.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : slot ? "Update Slot" : "Create Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
