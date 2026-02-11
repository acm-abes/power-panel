/** @format */

import { createPanel, deletePanel, getPanels } from "@/server/actions/panels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Page, PageContent, PageHeading } from "@/components/page";

export default async function AdminPanelsPage() {
  const panels = await getPanels();

  return (
    <Page>
      <PageHeading title={"Panels Management"} />

      <PageContent className="grid gap-8 md:grid-cols-3">
        {/* Create Panel Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Create Panel</CardTitle>
            <CardDescription>Add a new panel for evaluation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPanel as any} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Panel Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., AI Panel 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Submissions)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  defaultValue={5}
                  min={1}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Create Panel
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Panels List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Existing Panels</CardTitle>
            <CardDescription>List of all active judge panels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Judges</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panels.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No panels created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  panels.map((panel) => (
                    <TableRow key={panel.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {panel.name}
                          {panel.isLocked && (
                            <Badge variant="secondary">Locked</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{panel.capacity}</TableCell>
                      <TableCell>{panel._count.judges}</TableCell>
                      <TableCell>{panel._count.submissions}</TableCell>
                      <TableCell className="text-right">
                        <form action={deletePanel.bind(null, panel.id) as any}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
