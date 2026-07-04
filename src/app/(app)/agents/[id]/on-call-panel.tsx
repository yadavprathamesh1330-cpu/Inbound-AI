"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Icon } from "@/components/ui-custom/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OnCallPanel({
  agentId,
  initialOnCallPhone,
}: {
  agentId: string;
  initialOnCallPhone: string | null;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialOnCallPhone ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = phone.trim();
    if (trimmed && !/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      toast.error("Use E.164 format, e.g. +15551234567");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onCallPhone: trimmed || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Couldn't save.");
        return;
      }
      toast.success(trimmed ? "On-call number saved." : "On-call number cleared.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="space-y-3 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <Icon name="warning" className="size-4" />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Breakdown Escalation
        </h3>
      </div>
      <p className="text-label-md text-on-surface-variant">
        If a caller reports a breakdown or emergency, we&rsquo;ll text this
        number immediately so a human can call them back.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+15551234567"
          className="flex-1"
        />
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </GlassCard>
  );
}
