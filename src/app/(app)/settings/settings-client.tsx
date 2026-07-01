"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { AvatarLineSkeleton } from "@/components/ui-custom/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ApiKey,
  Notification,
  Organization,
} from "@/generated/prisma/client";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

function formatDateTime(date: Date | string | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const TABS = [
  { value: "business", label: "Business", icon: "business" },
  { value: "branding", label: "Branding", icon: "palette" },
  { value: "notifications", label: "Notifications", icon: "notifications" },
  { value: "integrations", label: "Integrations", icon: "webhook" },
  { value: "security", label: "Security", icon: "shield" },
  { value: "api-keys", label: "API Keys", icon: "vpn_key" },
  { value: "voice", label: "Voice Settings", icon: "settings_voice" },
];

export function SettingsClient({
  organization,
  initialNotifications,
  initialApiKeys,
}: {
  organization: Organization;
  initialNotifications: Notification[];
  initialApiKeys: ApiKey[];
}) {
  return (
    <Tabs defaultValue="business">
      <TabsList
        variant="line"
        className="mb-unit-lg h-auto w-full flex-wrap justify-start gap-1 border-b border-outline-variant/30 bg-transparent p-0"
      >
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <Icon name={tab.icon} className="size-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="business">
        <BusinessTab organization={organization} />
      </TabsContent>
      <TabsContent value="branding">
        <BrandingTab />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab initialNotifications={initialNotifications} />
      </TabsContent>
      <TabsContent value="integrations">
        <IntegrationsTab />
      </TabsContent>
      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>
      <TabsContent value="api-keys">
        <ApiKeysTab initialApiKeys={initialApiKeys} />
      </TabsContent>
      <TabsContent value="voice">
        <VoiceSettingsTab />
      </TabsContent>
    </Tabs>
  );
}

function BusinessTab({ organization }: { organization: Organization }) {
  const [name, setName] = useState(organization.name);
  const [website, setWebsite] = useState(organization.website ?? "");
  const [timezone, setTimezone] = useState(organization.timezone);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, website, timezone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save organization");
      }
      return res.json();
    },
    onSuccess: () => toast.success("Organization settings saved"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <GlassCard className="max-w-2xl space-y-unit-md p-unit-lg">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-website">Website</Label>
        <Input
          id="org-website"
          type="url"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select
          value={timezone}
          onValueChange={(v) => setTimezone(v ?? timezone)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </GlassCard>
  );
}

function BrandingTab() {
  return (
    <GlassCard className="max-w-2xl space-y-unit-lg p-unit-lg">
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Logo
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Upload a logo to show across the dashboard and customer-facing
          voice widgets.
        </p>
        <div className="mt-unit-md flex items-center gap-unit-md">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low">
            <Icon name="cloud_upload" className="size-6 text-outline" />
          </div>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button variant="outline" disabled>
                Upload logo
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              File storage isn&apos;t wired up yet — coming soon.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Brand color
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Choose an accent color for your agents&apos; voice widget and
          customer emails.
        </p>
        <div className="mt-unit-md flex items-center gap-3">
          {["#000000", "#0051d5", "#10b981", "#f59e0b"].map((c) => (
            <div
              key={c}
              className="size-8 rounded-full border border-outline-variant"
              style={{ backgroundColor: c }}
            />
          ))}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button variant="outline" size="sm" disabled>
                Custom color
              </Button>
            </TooltipTrigger>
            <TooltipContent>Coming soon.</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </GlassCard>
  );
}

function NotificationsTab({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const queryClient = useQueryClient();

  const { data: notifications = initialNotifications, isPending } = useQuery({
    queryKey: ["settings-notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const res = await fetch("/api/settings/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      return data.notifications;
    },
    initialData: initialNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark notifications read");
      return res.json();
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["settings-notifications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-unit-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "You're all caught up"}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          <Icon name="mark_email_read" data-icon="inline-start" />
          Mark all read
        </Button>
      </div>

      <GlassCard className="overflow-hidden p-0">
        {isPending ? (
          <div className="space-y-4 p-unit-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <AvatarLineSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No notifications"
            description="You'll see updates about your agents and account here."
          />
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 px-unit-lg py-4"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    n.read ? "bg-outline-variant" : "bg-secondary"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-body-md font-medium text-on-surface">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-label-sm text-on-surface-variant">
                      {n.body}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-on-surface-variant">
                  {formatDateTime(n.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <GlassCard className="flex max-w-2xl flex-col items-start gap-3 p-unit-lg">
      <div className="rounded-xl bg-secondary/10 p-3">
        <Icon name="webhook" className="size-5 text-secondary" />
      </div>
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Manage integrations
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Connect Slack, Google Sheets, Google Calendar, and CRMs from the
          dedicated Integrations page — connection state and OAuth flows
          live there, not in Settings.
        </p>
      </div>
      <Button render={<Link href="/integrations" />}>
        Go to Integrations
        <Icon name="arrow_forward" data-icon="inline-end" />
      </Button>
    </GlassCard>
  );
}

function SecurityTab() {
  return (
    <GlassCard className="max-w-2xl space-y-unit-lg p-unit-lg">
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Password
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Password changes are managed via Supabase Auth once your project
          is configured with email/password sign-in.
        </p>
        <Tooltip>
          <TooltipTrigger render={<span className="mt-unit-md block w-fit" />}>
            <Button variant="outline" disabled>
              Change password
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Supabase Auth isn&apos;t configured for this project yet.
          </TooltipContent>
        </Tooltip>
      </div>
      <Separator />
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Two-factor authentication
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Add an extra layer of security to your account. Managed via
          Supabase Auth.
        </p>
        <Tooltip>
          <TooltipTrigger render={<span className="mt-unit-md block w-fit" />}>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Supabase Auth isn&apos;t configured for this project yet.
          </TooltipContent>
        </Tooltip>
      </div>
    </GlassCard>
  );
}

function ApiKeysTab({ initialApiKeys }: { initialApiKeys: ApiKey[] }) {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const { data: apiKeys = initialApiKeys, isPending } = useQuery({
    queryKey: ["settings-api-keys"],
    queryFn: async (): Promise<ApiKey[]> => {
      const res = await fetch("/api/settings/api-keys");
      if (!res.ok) throw new Error("Failed to load API keys");
      const data = await res.json();
      return data.apiKeys;
    },
    initialData: initialApiKeys,
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create API key");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("API key created");
      setRevealedSecret(data.secret);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to revoke API key");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: ["settings-api-keys"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-unit-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Key name, e.g. Production server key"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button
          disabled={!newKeyName.trim() || createKey.isPending}
          onClick={() => createKey.mutate(newKeyName.trim())}
        >
          <Icon name="add" data-icon="inline-start" />
          Generate new key
        </Button>
      </div>

      {revealedSecret && (
        <GlassCard className="flex items-center justify-between gap-3 border-primary/30 p-unit-md">
          <div className="min-w-0">
            <p className="text-label-sm font-medium text-on-surface">
              Copy your new secret now — you won&apos;t be able to see it
              again.
            </p>
            <code className="mt-1 block truncate text-xs text-on-surface-variant">
              {revealedSecret}
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(revealedSecret);
              toast.success("Copied to clipboard");
            }}
          >
            <Icon name="content_copy" className="size-4" />
          </Button>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden p-0">
        {isPending ? (
          <div className="space-y-4 p-unit-lg">
            {Array.from({ length: 2 }).map((_, i) => (
              <AvatarLineSkeleton key={i} />
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          <EmptyState
            icon="vpn_key"
            title="No API keys"
            description="Generate a key to authenticate server-to-server requests against the Omni AI API."
          />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Name
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Key
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Last used
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Status
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {apiKeys.map((key) => (
                <tr
                  key={key.id}
                  className="transition-colors hover:bg-surface-container-low/30"
                >
                  <td className="px-unit-lg py-4 text-body-md text-on-surface">
                    {key.name}
                  </td>
                  <td className="px-unit-lg py-4 font-mono text-xs text-on-surface-variant">
                    {key.keyPrefix}••••••••
                  </td>
                  <td className="px-unit-lg py-4 text-body-md text-on-surface-variant">
                    {formatDateTime(key.lastUsedAt)}
                  </td>
                  <td className="px-unit-lg py-4">
                    {key.revokedAt ? (
                      <Badge className="bg-destructive/10 text-destructive">
                        Revoked
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-unit-lg py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!key.revokedAt || revokeKey.isPending}
                      onClick={() => {
                        if (confirm(`Revoke "${key.name}"?`)) {
                          revokeKey.mutate(key.id);
                        }
                      }}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}

function VoiceSettingsTab() {
  return (
    <GlassCard className="flex max-w-2xl flex-col items-start gap-3 p-unit-lg">
      <div className="rounded-xl bg-secondary/10 p-3">
        <Icon name="settings_voice" className="size-5 text-secondary" />
      </div>
      <div>
        <h3 className="text-subtitle-lg font-headline-md text-on-surface">
          Voice configuration lives per-agent
        </h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Voice gender, accent, speaking speed, and style are configured
          individually for each AI agent, not at the organization level.
          Open an agent to tune its voice.
        </p>
      </div>
      <Button render={<Link href="/agents" />}>
        Go to AI Agents
        <Icon name="arrow_forward" data-icon="inline-end" />
      </Button>
    </GlassCard>
  );
}
