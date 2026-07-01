"use client";

import { GlassCard } from "@/components/ui-custom/glass-card";
import { Icon } from "@/components/ui-custom/icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TestAgentPanel({
  greeting,
  systemPrompt,
}: {
  greeting: string | null;
  systemPrompt: string | null;
}) {
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
          Requires Twilio/telephony credentials to be configured. Coming soon.
        </TooltipContent>
      </Tooltip>
    </GlassCard>
  );
}
