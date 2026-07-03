"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PLANS = [
  { value: "trial", label: "Trial" },
  { value: "owner_operator", label: "Owner-Operator" },
  { value: "fleet", label: "Fleet" },
  { value: "enterprise", label: "Enterprise" },
];

export function AdminOrgControls({
  orgId,
  initialStatus,
  initialPlan,
}: {
  orgId: string;
  initialStatus: string;
  initialPlan: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [plan, setPlan] = useState(initialPlan);
  const [busy, setBusy] = useState(false);

  async function patch(payload: { status?: string; plan?: string }) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Update failed.");
        return false;
      }
      toast.success("Updated.");
      router.refresh();
      return true;
    } catch {
      toast.error("Network error — please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    const next = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (next === "SUSPENDED" && !confirm("Suspend this organization? Its users keep access to data but you can use this to flag non-payment.")) {
      return;
    }
    if (await patch({ status: next })) setStatus(next);
  }

  async function changePlan(next: string) {
    setPlan(next);
    await patch({ plan: next });
  }

  const suspended = status === "SUSPENDED";

  return (
    <div className="glass-card space-y-unit-lg rounded-2xl p-unit-lg">
      <h3 className="text-headline-md text-headline-md text-on-surface">
        Controls
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          Plan
        </label>
        <Select value={plan} onValueChange={(v) => v && changePlan(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLANS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          Status
        </label>
        <div className="flex items-center justify-between rounded-xl border border-outline-variant px-4 py-3">
          <span
            className={cn(
              "flex items-center gap-2 text-body-md font-semibold",
              suspended ? "text-error" : "text-emerald-600",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                suspended ? "bg-error" : "bg-emerald-500",
              )}
            />
            {suspended ? "Suspended" : "Active"}
          </span>
          <button
            disabled={busy}
            onClick={toggleStatus}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-label-md font-semibold transition-colors disabled:opacity-50",
              suspended
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-error/10 text-error hover:bg-error/20",
            )}
          >
            <Icon name={suspended ? "check_circle" : "pause_circle"} className="size-4" />
            {suspended ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}
