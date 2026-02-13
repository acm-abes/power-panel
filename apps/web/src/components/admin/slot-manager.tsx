/** @format */

"use client";

import { useEffect, useState } from "react";
import { getSlotsAction, deleteSlotAction } from "@/server/actions/admin-slots";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock, Users, Grid3x3 } from "lucide-react";
import { SlotFormDialog } from "./slot-form-dialog";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";

interface EvaluationSlot {
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

export function SlotManager() {
  const [slots, setSlots] = useState<EvaluationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EvaluationSlot | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<EvaluationSlot | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    const result = await getSlotsAction();
    if (result.success && result.slots) {
      setSlots(result.slots);
    } else {
      toast.error(result.error || "Failed to load slots");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, []);

  const handleCreateNew = () => {
    setEditingSlot(null);
    setDialogOpen(true);
  };

  const handleEdit = (slot: EvaluationSlot) => {
    setEditingSlot(slot);
    setDialogOpen(true);
  };

  const handleDeleteClick = (slot: EvaluationSlot) => {
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;

    const result = await deleteSlotAction(slotToDelete.id);
    if (result.success) {
      toast.success("Slot deleted successfully");
      loadSlots();
    } else {
      toast.error(result.error || "Failed to delete slot");
    }
    setDeleteDialogOpen(false);
    setSlotToDelete(null);
  };

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false);
    setEditingSlot(null);
    if (shouldRefresh) {
      loadSlots();
    }
  };

  const formatTime = (time: string) => {
    // Assuming time is in HH:MM format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayLabel = (day: number) => {
    return `Day ${day}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Slots</h2>
          <p className="text-muted-foreground">
            {slots.length} slot{slots.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className=" h-4 w-4" />
          Create Slot
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time Range</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Judges Available</TableHead>
              <TableHead>Panels</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading slots...
                </TableCell>
              </TableRow>
            ) : slots.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No slots created yet. Create your first slot to get started.
                </TableCell>
              </TableRow>
            ) : (
              slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">{slot.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDayLabel(slot.day)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{slot.slotOrder}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{slot._count.judgeAvailabilities}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                      <span>{slot._count.panels}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(slot)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(slot)}
                        disabled={slot._count.panels > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SlotFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        slot={editingSlot}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{slotToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSlotToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
