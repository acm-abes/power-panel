/** @format */

"use client";

import { useState } from "react";
import { GeneratedPanel } from "@power/allocation";
import { Panel } from "@power/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Users, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  previewPanelsAction,
  confirmPanelsAction,
} from "@/server/actions/admin-allocation";
import { deletePanel } from "@/server/actions/panels";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PanelGenerationDialog } from "@/components/admin/panel-generation-dialog";

interface PanelManagerProps {
  initialPanels: (Panel & {
    _count: { judges: number; submissions: number };
    judges: { user: { id: string; name: string; trackPreferences: any } }[];
  })[];
}

export function PanelManager({ initialPanels }: PanelManagerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "preview-panels">("list");
  const [previewPanels, setPreviewPanels] = useState<GeneratedPanel[]>([]);
  const [panelStrategy, setPanelStrategy] = useState<"fresh" | "unallocated">(
    "fresh",
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleGeneratePanels(config: {
    strategy: "fresh" | "unallocated";
    judgesPerPanel: number;
    capacity: number;
  }) {
    setIsLoading(true);
    const result = await previewPanelsAction(config);
    setIsLoading(false);

    if (result.success && result.panels) {
      setPreviewPanels(result.panels);
      setPanelStrategy(config.strategy);
      setViewMode("preview-panels");
      toast.success("Panels generated successfully (Preview Mode)");
    } else {
      toast.error(result.error || "Failed to generate panels");
    }
  }

  async function handleConfirmPanels() {
    setIsLoading(true);
    const result = await confirmPanelsAction(previewPanels, panelStrategy);
    setIsLoading(false);

    if (result.success) {
      toast.success("Panels saved to database");
      setViewMode("list");
      setPreviewPanels([]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save panels");
    }
  }

  async function handleDeletePanel(id: string) {
    // In a real app, use a proper dialog. generic confirm is okay for now as requested for speed.
    if (
      !confirm(
        "Are you sure you want to delete this panel? This action cannot be undone.",
      )
    )
      return;

    setIsLoading(true);
    const result = await deletePanel(id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Panel deleted");
      router.refresh();
    } else {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Failed to delete panel",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {viewMode === "list" && (
          <>
            <PanelGenerationDialog
              isLoading={isLoading}
              onGenerate={handleGeneratePanels}
            />
            <Link href="/admin/panels/assignments">
              <Button variant="outline" disabled={initialPanels.length === 0}>
                <Users className="mr-2 h-4 w-4" />
                Manage Assignments
              </Button>
            </Link>
          </>
        )}
      </div>

      {viewMode === "preview-panels" && (
        <Card className="border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary">
              Previewing {previewPanels.length} Generated Panels
            </CardTitle>
            <CardDescription>
              Review the proposed panel structure before saving. Does not affect
              current data.
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleConfirmPanels} disabled={isLoading}>
                <Check className="mr-2 h-4 w-4" /> Confirm & Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode("list")}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {previewPanels.map((panel, idx) => (
                <AccordionItem value={`preview-${idx}`} key={idx}>
                  <AccordionTrigger className="hover:no-underline px-2">
                    <div className="flex items-center gap-4 text-left w-full">
                      <span className="font-semibold text-lg">
                        Panel {panel.id}
                      </span>
                      <div className="flex gap-2 ml-auto mr-4">
                        {panel.trackScore.AI > 0 && (
                          <Badge variant="outline" className="text-xs">
                            AI: {panel.trackScore.AI.toFixed(1)}
                          </Badge>
                        )}
                        {panel.trackScore.Web3 > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Web3: {panel.trackScore.Web3.toFixed(1)}
                          </Badge>
                        )}
                        {panel.trackScore.Defense > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Def: {panel.trackScore.Defense.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {panel.judges.length} Judges
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 p-4 bg-muted/30 rounded-md">
                      {panel.judges.map((j) => (
                        <div
                          key={j.id}
                          className="flex justify-between items-center text-sm p-2 bg-background rounded border"
                        >
                          <span className="font-medium">{j.name}</span>
                          <div className="text-muted-foreground text-xs flex gap-2">
                            <span>AI: {j.trackPreferences.AI}</span>
                            <span>Web3: {j.trackPreferences.Web3}</span>
                            <span>Defense: {j.trackPreferences.Defense}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Existing Database Panels (Read-Only List) */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Current Panels</CardTitle>
            <CardDescription>
              Manage existing panels and their judges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialPanels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No panels found. Click "Auto-Generate Panels" to get started.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {initialPanels.map((panel) => (
                  <AccordionItem value={panel.id} key={panel.id}>
                    <AccordionTrigger className="hover:no-underline px-2">
                      <div className="flex items-center gap-4 text-left w-full">
                        {panel.isLocked && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-lg">
                          {panel.name}
                        </span>

                        <div className="ml-auto mr-4 flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            Cap: {panel.capacity}
                          </Badge>
                          <Badge variant="secondary">
                            {panel._count.judges} Judges
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 space-y-6 bg-muted/10 rounded-b-md">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" /> Judges
                            </h4>
                            <div className="space-y-2">
                              {panel.judges.map((pj) => (
                                <div
                                  key={pj.user.id}
                                  className="text-sm p-3 bg-card border rounded flex justify-between items-center shadow-sm"
                                >
                                  <span className="font-medium">
                                    {pj.user.name}
                                  </span>
                                  <div className="text-xs text-muted-foreground flex gap-2">
                                    <span title="AI Score">
                                      AI:{pj.user.trackPreferences?.AI ?? 0}
                                    </span>
                                    <span title="Web3 Score">
                                      W3:{pj.user.trackPreferences?.Web3 ?? 0}
                                    </span>
                                    <span title="Defense Score">
                                      D:{pj.user.trackPreferences?.Defense ?? 0}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-3">
                              Panel Stats
                            </h4>
                            <div className="p-3 bg-card border rounded shadow-sm space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Assigned Submissions
                                </span>
                                <span className="font-medium">
                                  {panel._count.submissions}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Capacity
                                </span>
                                <span className="font-medium">
                                  {panel.capacity}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Status
                                </span>
                                <Badge
                                  variant={
                                    panel.isLocked ? "destructive" : "default"
                                  }
                                  className="text-xs"
                                >
                                  {panel.isLocked ? "Locked" : "Active"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePanel(panel.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Panel
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
