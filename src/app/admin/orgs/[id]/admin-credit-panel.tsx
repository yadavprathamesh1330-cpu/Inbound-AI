"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const QUICK = [10, 50, 100, 500];

export function AdminCreditPanel({
  orgId,
  initialCents,
}: {
  orgId: string;
  initialCents: number;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialCents);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(dollars: number, m: "add" | "deduct", why?: string) {
    if (!dollars || dollars <= 0) {
      toast.error("Enter an amount greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountDollars: dollars, mode: m, reason: why }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't adjust credits.");
        return;
      }
      setBalance(data.balanceCents);
      setAmount("");
      setReason("");
      toast.success(
        `${m === "add" ? "Added" : "Deducted"} $${dollars.toFixed(2)} — new balance ${usd(data.balanceCents)}.`,
      );
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-unit-lg">
      <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
        Credit Balance
      </p>
      <p
        className={cn(
          "mt-1 text-4xl font-bold",
          balance <= 0 ? "text-error" : "text-on-surface",
        )}
      >
        {usd(balance)}
      </p>
      <p className="mt-1 text-label-sm text-on-surface-variant">
        ≈ {Math.round((balance / 100 / 0.1))} call-minutes at $0.10/min
      </p>

      {/* Quick add */}
      <div className="mt-unit-lg">
        <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
          Quick add
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              disabled={submitting}
              onClick={() => submit(q, "add", "Quick add")}
              className="rounded-xl border border-outline-variant px-4 py-2 text-label-md font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              +${q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom adjust */}
      <div className="mt-unit-lg space-y-unit-md border-t border-outline-variant/50 pt-unit-lg">
        <div className="grid grid-cols-2 gap-2">
          {(["add", "deduct"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-label-md font-semibold capitalize transition-all",
                mode === m
                  ? m === "add"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                    : "border-error bg-error/10 text-error"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-7 pr-3 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional) — e.g. promo, refund, top-up"
          className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary"
        />
        <button
          disabled={submitting}
          onClick={() => submit(Number(amount), mode, reason || undefined)}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60",
            mode === "add" ? "bg-emerald-600" : "bg-error",
          )}
        >
          <Icon name={mode === "add" ? "add_circle" : "remove_circle"} className="size-5" />
          {mode === "add" ? "Add credits" : "Deduct credits"}
        </button>
      </div>
    </div>
  );
}
