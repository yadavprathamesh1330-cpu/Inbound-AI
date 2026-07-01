import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentStatus, IntegrationProvider } from "@/generated/prisma/client";
import type {
  Agent,
  AgentIntegration,
  Integration,
} from "@/generated/prisma/client";

type AgentWithIntegrations = Agent & {
  integrations: (AgentIntegration & { integration: Integration })[];
};

const providerMeta: Record<
  IntegrationProvider,
  { label: string; icon: string; className: string }
> = {
  GOOGLE_SHEETS: {
    label: "Google Sheets",
    icon: "hub",
    className: "bg-orange-50 text-orange-600",
  },
  GOOGLE_CALENDAR: {
    label: "Google Calendar",
    icon: "bolt",
    className: "bg-orange-50 text-orange-600",
  },
  SLACK: {
    label: "Slack",
    icon: "forum",
    className: "bg-purple-50 text-purple-600",
  },
  WEBHOOK: {
    label: "Webhook",
    icon: "cloud",
    className: "bg-sky-50 text-sky-600",
  },
  HUBSPOT: {
    label: "HubSpot",
    icon: "sync",
    className: "bg-amber-50 text-amber-700",
  },
  SALESFORCE: {
    label: "Salesforce",
    icon: "cloud",
    className: "bg-sky-50 text-sky-700",
  },
  ZOHO: {
    label: "Zoho",
    icon: "sync",
    className: "bg-rose-50 text-rose-700",
  },
};

const statusMeta: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  PUBLISHED: { label: "Live", className: "bg-emerald-50 text-emerald-700" },
  DRAFT: { label: "Draft", className: "bg-surface-container-high text-on-surface-variant" },
  PAUSED: { label: "Paused", className: "bg-amber-50 text-amber-700" },
};

export function WorkflowCard({ agent }: { agent: AgentWithIntegrations }) {
  const isDraftLike = agent.status !== AgentStatus.PUBLISHED;
  const linkedIntegrations = agent.integrations.map((link) => link.integration);

  return (
    <GlassCard
      className={cn(
        "p-unit-lg transition-all duration-300",
        isDraftLike && "border-dashed opacity-90",
      )}
    >
      <div className="mb-unit-md flex items-start justify-between">
        <div className="flex gap-unit-md">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10 text-secondary">
            <Icon name="smart_toy" className="size-6" />
          </div>
          <div>
            <h3 className="text-[18px] font-headline-md font-bold text-on-surface">
              {agent.name}
            </h3>
            <p className="flex items-center gap-1 text-[12px] text-on-surface-variant">
              <Icon name="history" className="size-3.5" />
              Updated {new Date(agent.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <Badge className={statusMeta[agent.status].className}>
          {statusMeta[agent.status].label}
        </Badge>
      </div>

      <div className="space-y-unit-md">
        {/* Trigger: transfer rules */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-unit-md">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Trigger &middot; Transfer rules
            </span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>
          <p className="flex items-start gap-2 text-body-md font-medium text-on-surface">
            <Icon name="adjust" className="mt-0.5 size-4 shrink-0 text-secondary" />
            {agent.transferRules ?? "No transfer rules configured yet."}
          </p>
        </div>

        <div className="relative -my-2 flex justify-center">
          <div className="h-6 w-px bg-outline-variant/50" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline-variant/30 bg-surface p-1">
            <Icon name="south" className="size-3.5 text-outline" />
          </div>
        </div>

        {/* Action: business rules */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-highest/30 p-unit-md">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Action &middot; Business rules
            </span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>
          <p className="flex items-start gap-2 text-body-md text-on-surface">
            <Icon name="task_alt" className="mt-0.5 size-4 shrink-0 text-primary" />
            {agent.businessRules ?? "No business rules configured yet."}
          </p>
        </div>
      </div>

      <div className="mt-unit-lg flex items-center justify-between border-t border-outline-variant/30 pt-unit-md">
        {linkedIntegrations.length > 0 ? (
          <div className="flex -space-x-2">
            {linkedIntegrations.map((integration) => {
              const meta = providerMeta[integration.provider];
              return (
                <div
                  key={integration.id}
                  title={meta.label}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-surface",
                    meta.className,
                  )}
                >
                  <Icon name={meta.icon} className="size-4" />
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[12px] text-on-surface-variant">
            No integrations linked to this agent yet
          </span>
        )}
        <span className="flex items-center gap-1 text-[12px] font-label-sm text-on-surface-variant">
          {agent.objectives.length} objective
          {agent.objectives.length === 1 ? "" : "s"}
        </span>
      </div>
    </GlassCard>
  );
}
