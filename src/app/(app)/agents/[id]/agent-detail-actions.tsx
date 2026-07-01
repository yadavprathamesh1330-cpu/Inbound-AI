"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { Button } from "@/components/ui/button";

export function AgentDetailActions({
  agentId,
  status,
}: {
  agentId: string;
  status: string;
}) {
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      return res.json();
    },
    onSuccess: (_data, nextStatus) => {
      toast.success(nextStatus === "PUBLISHED" ? "Agent published" : "Agent paused");
      router.refresh();
    },
    onError: () => toast.error("Could not update agent status"),
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={statusMutation.isPending}
        onClick={() =>
          statusMutation.mutate(status === "PUBLISHED" ? "PAUSED" : "PUBLISHED")
        }
      >
        <Icon
          name={status === "PUBLISHED" ? "pause_circle" : "rocket_launch"}
          className="mr-1.5 size-4"
        />
        {status === "PUBLISHED" ? "Pause" : "Publish"}
      </Button>
      <Button
        render={
          <a href="#test-agent-panel" />
        }
      >
        <Icon name="experiment" className="mr-1.5 size-4" />
        Test Agent
      </Button>
    </div>
  );
}
