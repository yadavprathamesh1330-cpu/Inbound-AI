"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Icon } from "@/components/ui-custom/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent } from "@/generated/prisma/client";

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-600",
  DRAFT: "bg-slate-100 text-slate-600",
  PAUSED: "bg-amber-50 text-amber-600",
};

const statusDotStyles: Record<string, string> = {
  PUBLISHED: "bg-emerald-600",
  DRAFT: "bg-slate-500",
  PAUSED: "bg-amber-600",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function objectiveLabel(objective: string) {
  return objective
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function AgentsGridClient({ initialAgents }: { initialAgents: Agent[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

  function invalidateAndRefresh() {
    queryClient.invalidateQueries({ queryKey: ["agents"] });
    router.refresh();
  }

  const duplicateMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`/api/agents/${agentId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate agent");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Agent duplicated");
      invalidateAndRefresh();
    },
    onError: () => toast.error("Could not duplicate agent"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: string }) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "PUBLISHED" ? "Agent published" : "Agent paused",
      );
      invalidateAndRefresh();
    },
    onError: () => toast.error("Could not update agent status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Agent deleted");
      setDeleteTarget(null);
      invalidateAndRefresh();
    },
    onError: () => toast.error("Could not delete agent"),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {initialAgents.map((agent) => (
          <GlassCard key={agent.id} className="relative overflow-hidden p-6">
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  statusStyles[agent.status],
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    statusDotStyles[agent.status],
                    agent.status === "PUBLISHED" && "animate-pulse",
                  )}
                />
                {agent.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" />
                  }
                >
                  <Icon name="more_vert" className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => duplicateMutation.mutate(agent.id)}
                  >
                    <Icon name="content_copy" className="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      statusMutation.mutate({
                        agentId: agent.id,
                        status:
                          agent.status === "PUBLISHED" ? "PAUSED" : "PUBLISHED",
                      })
                    }
                  >
                    <Icon
                      name={agent.status === "PUBLISHED" ? "pause_circle" : "rocket_launch"}
                      className="mr-2 size-4"
                    />
                    {agent.status === "PUBLISHED" ? "Pause" : "Publish"}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href={`/agents/${agent.id}`} />}>
                    <Icon name="bar_chart" className="mr-2 size-4" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href={`/agents/${agent.id}#test`} />}>
                    <Icon name="experiment" className="mr-2 size-4" />
                    Test Agent
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(agent)}
                  >
                    <Icon name="delete" className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link
              href={`/agents/${agent.id}`}
              className="flex flex-col items-center pt-2 text-center"
            >
              <div className="relative mb-4">
                <div className="flex size-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-secondary/10 to-primary/5 p-1">
                  <div className="flex size-full items-center justify-center rounded-[20px] border border-outline-variant/20 bg-surface-container-lowest text-headline-md font-bold text-on-surface">
                    {getInitials(agent.name)}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-outline-variant/20 bg-surface shadow-sm">
                  <Icon name="support_agent" className="size-4 text-primary" />
                </div>
              </div>
              <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                {agent.name}
              </h3>
              <p className="text-label-sm text-outline">
                {agent.industry ?? agent.businessName}
              </p>
            </Link>

            <div className="mt-6 space-y-4">
              {agent.objectives.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {agent.objectives.map((objective) => (
                    <span
                      key={objective}
                      className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      {objectiveLabel(objective)}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-surface-container-low p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-outline">
                    Success Rate
                  </span>
                  <span className="font-mono-label text-primary">
                    {agent.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/20">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${Math.min(100, agent.successRate)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1 text-label-sm">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <Icon name="call" className="size-3.5" />
                  {agent.totalCalls.toLocaleString()} calls
                </span>
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <Icon name="record_voice_over" className="size-3.5" />
                  {agent.voiceGender === "FEMALE" ? "Female" : "Male"}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete agent</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-bold text-on-surface">
                {deleteTarget?.name}
              </span>{" "}
              and all of its associated calls, leads, and knowledge documents.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
