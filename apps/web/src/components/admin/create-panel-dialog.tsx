/** @format */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createManualPanel } from "@/server/actions/admin-allocation";

type Slot = {
  id: string;
  name: string;
};

type CreatePanelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: Slot[];
  onPanelCreated: (panel: any) => void;
};

export function CreatePanelDialog({
  open,
  onOpenChange,
  slots,
  onPanelCreated,
}: CreatePanelDialogProps) {
  const [name, setName] = useState("");
  const [slotId, setSlotId] = useState("");
  const [capacity, setCapacity] = useState("5");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Panel name is required");
      return;
    }

    if (!slotId) {
      toast.error("Please select a slot");
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      toast.error("Capacity must be at least 1");
      return;
    }

    setCreating(true);

    const result = await createManualPanel({
      name: name.trim(),
      slotId,
      capacity: capacityNum,
      notes: notes.trim() || undefined,
    });

    setCreating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Panel created successfully");
    onPanelCreated(result.panel);

    // Reset form
    setName("");
    setSlotId("");
    setCapacity("5");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Panel</DialogTitle>
          <DialogDescription>
            Create an empty panel and manually assign judges and submissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Panel Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Panel A, AI-Panel-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot">Evaluation Slot *</Label>
            <Select
              value={slotId}
              onValueChange={setSlotId}
              disabled={creating}
            >
              <SelectTrigger id="slot">
                <SelectValue placeholder="Select a slot" />
              </SelectTrigger>
              <SelectContent>
                {slots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="Maximum submissions"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of submissions this panel can evaluate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this panel..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={creating}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
