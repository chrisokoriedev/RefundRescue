"use client";

import { useState } from "react";
import { useCachedApi } from "@/lib/useCachedApi";
import {
  fetchPlaybooks,
  createPlaybook,
  deletePlaybook,
  updatePlaybook,
  type Playbook,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, FileStack } from "lucide-react";
import { toast } from "sonner";

export default function PlaybooksPage() {
  const { data: playbooksRes, loading, mutate } = useCachedApi(
    "playbooks_list",
    () => fetchPlaybooks()
  );
  const playbooks = playbooksRes?.data || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    scenario: "payment_failed",
    promptTemplate: "",
    weight: 50,
  });

  const load = () => {
    mutate();
  };

  const handleCreate = async () => {
    try {
      await createPlaybook(form);
      toast.success("Playbook created");
      setDialogOpen(false);
      setForm({ name: "", scenario: "payment_failed", promptTemplate: "", weight: 50 });
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create playbook");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaybook(id);
      toast.success("Playbook deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete playbook");
    }
  };

  const handleToggle = async (p: Playbook) => {
    try {
      await updatePlaybook(p.id, { active: !p.active });
      toast.success(p.active ? "Playbook deactivated" : "Playbook activated");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update playbook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Playbooks</h1>
          <p className="text-muted-foreground text-sm">
            Manage voice prompt strategies and A/B testing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Playbook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playbook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Enterprise Payment Failure"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scenario</Label>
                <Select
                  value={form.scenario}
                  onValueChange={(v) => setForm({ ...form, scenario: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="subscription_deleted">
                      Subscription Deleted
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prompt Template</Label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Hello {customerName}, we noticed your payment for the {planName} plan failed..."
                  value={form.promptTemplate}
                  onChange={(e) =>
                    setForm({ ...form, promptTemplate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (A/B Test): {form.weight}%</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Playbook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playbook List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : playbooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileStack className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No playbooks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first playbook to start A/B testing voice prompts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {playbooks.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {p.scenario.replace("_", " ")}
                  </p>
                </div>
                <Badge variant={p.active ? "default" : "secondary"}>
                  {p.active ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {p.promptTemplate || "No prompt template"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Weight: {p.weight}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(p)}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
