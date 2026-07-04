"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Icon } from "@/components/ui-custom/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TestAgentPanel({
  agentId,
  greeting,
  systemPrompt,
  hasPhoneNumber,
}: {
  agentId: string;
  greeting: string | null;
  systemPrompt: string | null;
  hasPhoneNumber: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [calling, setCalling] = useState(false);

  async function startTestCall() {
    if (!/^\+[1-9]\d{6,14}$/.test(phone.trim())) {
      toast.error("Enter your number in E.164 format, e.g. +919812345678");
      return;
    }
    setCalling(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/test-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't start the test call.");
        return;
      }
      toast.success("Calling you now — pick up to talk to your agent!");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setCalling(false);
    }
  }

  return (
    <GlassCard id="test-agent-panel" className="h-fit space-y-4 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Icon name="experiment" className="size-4" />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">Test Agent</h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Greeting
          </p>
          <p className="mt-1 rounded-xl bg-surface-container-low p-3 text-label-md text-on-surface">
            {greeting || "No greeting configured yet."}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
            System Prompt
          </p>
          <p className="mt-1 max-h-40 overflow-y-auto rounded-xl bg-surface-container-low p-3 text-label-md text-on-surface custom-scrollbar">
            {systemPrompt || "No system prompt configured yet."}
          </p>
        </div>
      </div>

      {hasPhoneNumber ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Your Number
          </p>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919812345678"
          />
          <Button
            className="w-full"
            disabled={calling}
            onClick={startTestCall}
          >
            <Icon name="call" className="mr-1.5 size-4" />
            {calling ? "Calling…" : "Start Test Call"}
          </Button>
          <p className="text-[11px] text-on-surface-variant">
            We&rsquo;ll call this number from your agent&rsquo;s line — answer
            to talk to it live.
          </p>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="block">
                <Button disabled className="w-full">
                  <Icon name="call" className="mr-1.5 size-4" />
                  Start Test Call
                </Button>
              </span>
            }
          />
          <TooltipContent>
            Connect a phone number to this agent first (Phone Numbers page).
          </TooltipContent>
        </Tooltip>
      )}
    </GlassCard>
  );
}
