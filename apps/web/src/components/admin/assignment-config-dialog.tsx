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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users } from "lucide-react";

interface AssignmentConfigDialogProps {
  isLoading: boolean;
  disabled?: boolean;
  onGenerate: (config: {
    strategy: "better-panel-first" | "equal-distribution";
  }) => void;
}

export function AssignmentConfigDialog({
  isLoading,
  disabled,
  onGenerate,
}: AssignmentConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<
    "better-panel-first" | "equal-distribution"
  >("better-panel-first");

  function handleGenerate() {
    onGenerate({ strategy });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isLoading || disabled}>
          <Users className="mr-2 h-4 w-4" />
          Preview Assignments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Configure Team Assignments</DialogTitle>
          <DialogDescription>
            Choose how submissions should be distributed across panels. You can
            review the results before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
