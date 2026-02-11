/** @format */

"use client";

import { useState } from "react";
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
import { Wand2 } from "lucide-react";

interface PanelGenerationDialogProps {
  isLoading: boolean;
  onGenerate: (config: {
    strategy: "fresh" | "unallocated";
    judgesPerPanel: number;
    capacity: number;
  }) => void;
}

export function PanelGenerationDialog({
  isLoading,
  onGenerate,
}: PanelGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<"fresh" | "unallocated">(
    "unallocated",
  );
  const [judgesPerPanel, setJudgesPerPanel] = useState(3);
  const [capacity, setCapacity] = useState(5);

  function handleGenerate() {
    onGenerate({ strategy, judgesPerPanel, capacity });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isLoading}>
          <Wand2 className="mr-2 h-4 w-4" />
          Auto-Generate Panels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Judge Panels</DialogTitle>
          <DialogDescription>
            Configure how the system should create panels. You can review the
            results before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
                    Create new panels using only judges who aren't currently
                    assigned. Existing panels remain unchanged.
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
                    Clear all existing panels and redistribute all judges into
                    new balanced panels.
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
          <Button onClick={handleGenerate}>Generate Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
