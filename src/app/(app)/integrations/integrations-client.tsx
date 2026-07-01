"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationProvider } from "@/generated/prisma/client";

type IntegrationRow = Omit<Integration, "config"> & {
  config: Record<string, unknown> | null;
};

const PROVIDER_META: Record<
  IntegrationProvider,
  { name: string; description: string; icon: string; iconClassName: string }
> = {
  GOOGLE_SHEETS: {
    name: "Google Sheets",
    description:
      "Automatically sync call summaries and lead data to a Google Sheet.",
    icon: "table_chart",
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  GOOGLE_CALENDAR: {
    name: "Google Calendar",
    description:
      "Let your agents book, reschedule, and cancel appointments directly on your calendar.",
    icon: "calendar_month",
    iconClassName: "bg-blue-50 text-blue-600",
  },
  SLACK: {
    name: "Slack",
    description:
      "Get real-time notifications in your team channels for high-priority calls and leads.",
    icon: "forum",
    iconClassName: "bg-purple-50 text-purple-600",
  },
  WEBHOOK: {
    name: "Webhook",
    description:
      "Send a POST request to your own endpoint whenever a call, lead, or appointment is created.",
    icon: "webhook",
    iconClassName: "bg-surface-container-highest text-on-surface-variant",
  },
  HUBSPOT: {
    name: "HubSpot",
    description:
      "Automatically update contact activities and lead scores in HubSpot CRM.",
    icon: "hub",
    iconClassName: "bg-orange-50 text-orange-600",
  },
  SALESFORCE: {
    name: "Salesforce",
    description:
      "Push call recordings and AI-generated insights directly into Salesforce records.",
    icon: "hub",
    iconClassName: "bg-sky-50 text-sky-600",
  },
  ZOHO: {
    name: "Zoho CRM",
    description: "Sync leads and call outcomes with your Zoho CRM pipeline.",
    icon: "hub",
    iconClassName: "bg-red-50 text-red-600",
  },
};

const STATUS_STYLES: Record<Integration["status"], string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700",
  DISCONNECTED: "bg-surface-container-highest text-on-surface-variant",
  ERROR: "bg-error-container text-on-error-container",
};

const STATUS_LABELS: Record<Integration["status"], string> = {
  CONNECTED: "Connected",
  DISCONNECTED: "Not connected",
  ERROR: "Error",
};

function useIntegrationMutation(
  onSettled: (provider: IntegrationProvider, row: IntegrationRow) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      status,
      config,
    }: {
      provider: IntegrationProvider;
      status: "CONNECTED" | "DISCONNECTED";
      config?: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/integrations/${provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, config }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update integration");
      }
      return res.json() as Promise<IntegrationRow>;
    },
    onSuccess: (row, variables) => {
      onSettled(variables.provider, row);
      toast.success(
        variables.status === "CONNECTED"
          ? `${PROVIDER_META[variables.provider].name} connected`
          : `${PROVIDER_META[variables.provider].name} disconnected`,
      );
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update integration");
    },
  });
}

function WebhookDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initialUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  isPending: boolean;
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setUrl(initialUrl);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a webhook</DialogTitle>
          <DialogDescription>
            Omni AI will send a POST request to this URL whenever a call,
            lead, or appointment is created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://hooks.example.com/omni-ai"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              if (!url.trim()) {
                toast.error("Enter a webhook URL first");
                return;
              }
              onSubmit(url.trim());
            }}
          >
            {isPending ? "Saving…" : "Save & connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onOpenWebhookDialog,
  isPending,
}: {
  integration: IntegrationRow;
  onConnect: (provider: IntegrationProvider) => void;
  onDisconnect: (provider: IntegrationProvider) => void;
  onOpenWebhookDialog: () => void;
  isPending: boolean;
}) {
  const meta = PROVIDER_META[integration.provider];
  const isConnected = integration.status === "CONNECTED";

  return (
    <GlassCard className="flex flex-col p-6">
      <div
        className={cn(
          "mb-6 flex size-12 items-center justify-center rounded-xl shadow-sm",
          meta.iconClassName,
        )}
      >
        <Icon name={meta.icon} className="size-6" />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[18px] font-headline-md font-bold text-on-surface">
          {meta.name}
        </h3>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            STATUS_STYLES[integration.status],
          )}
        >
          {STATUS_LABELS[integration.status]}
        </span>
      </div>
      <p className="mb-6 flex-1 text-label-sm leading-relaxed text-on-surface-variant">
        {meta.description}
      </p>
      {integration.provider === "WEBHOOK" && isConnected && (
        <p className="mb-4 truncate rounded-lg bg-surface-container-low px-3 py-2 font-mono text-[11px] text-on-surface-variant">
          {typeof integration.config?.url === "string"
            ? integration.config.url
            : "—"}
        </p>
      )}
      {isConnected ? (
        <Button
          variant="outline"
          className="w-full rounded-[14px] py-3 font-label-sm text-label-sm font-bold"
          disabled={isPending}
          onClick={() => onDisconnect(integration.provider)}
        >
          Disconnect
        </Button>
      ) : (
        <Button
          className="w-full rounded-[14px] py-3 font-label-sm text-label-sm font-bold"
          disabled={isPending}
          onClick={() =>
            integration.provider === "WEBHOOK"
              ? onOpenWebhookDialog()
              : onConnect(integration.provider)
          }
        >
          Connect
        </Button>
      )}
    </GlassCard>
  );
}

export function IntegrationsClient({
  initialIntegrations,
}: {
  initialIntegrations: IntegrationRow[];
}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const mutation = useIntegrationMutation((provider, row) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.provider === provider ? row : i)),
    );
    setWebhookDialogOpen(false);
  });

  const connectedCount = integrations.filter((i) => i.status === "CONNECTED").length;
  const webhookIntegration = integrations.find((i) => i.provider === "WEBHOOK");

  // Google OAuth is not wired up yet - GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET
  // (see .env.example) and a real `/api/integrations/google/callback`
  // handler are required for a production connection. This button only
  // flips the row to CONNECTED with a placeholder config so the UI/data
  // model wiring can be exercised end-to-end.
  function handleConnect(provider: IntegrationProvider) {
    const placeholderConfig =
      provider === "GOOGLE_SHEETS"
        ? { spreadsheetName: "Omni AI - Call Log" }
        : provider === "GOOGLE_CALENDAR"
          ? { calendarName: "My Business Appointments" }
          : undefined;
    mutation.mutate({ provider, status: "CONNECTED", config: placeholderConfig });
  }

  function handleDisconnect(provider: IntegrationProvider) {
    mutation.mutate({ provider, status: "DISCONNECTED" });
  }

  return (
    <div className="space-y-unit-2xl">
      <section>
        <div className="mb-unit-md flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            All Integrations
          </h2>
          <span className="rounded-full bg-secondary/10 px-3 py-1 font-mono-label text-[10px] text-secondary">
            {connectedCount} ACTIVE
          </span>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onOpenWebhookDialog={() => setWebhookDialogOpen(true)}
              isPending={mutation.isPending}
            />
          ))}
        </div>
      </section>

      <WebhookDialog
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
        isPending={mutation.isPending}
        initialUrl={
          typeof webhookIntegration?.config?.url === "string"
            ? webhookIntegration.config.url
            : ""
        }
        onSubmit={(url) =>
          mutation.mutate({
            provider: "WEBHOOK",
            status: "CONNECTED",
            config: { url },
          })
        }
      />
    </div>
  );
}
