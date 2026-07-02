"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Provider = "twilio" | "signalwire";

interface PhoneRow {
  id: string;
  e164: string;
  label: string | null;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
}

export function PhoneNumbersClient({
  numbers,
  agents,
  connectedProvider,
}: {
  numbers: PhoneRow[];
  agents: { id: string; name: string }[];
  connectedProvider: string | null;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>(
    connectedProvider === "signalwire" ? "signalwire" : "twilio",
  );
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [spaceUrl, setSpaceUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTwilio = provider === "twilio";

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/phone-numbers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          accountSid: accountSid.trim(),
          authToken: authToken.trim(),
          spaceUrl: isTwilio ? undefined : spaceUrl.trim(),
          phoneNumber: phoneNumber.trim(),
          agentId: agentId || undefined,
          label: label.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't connect the number.");
        return;
      }
      toast.success(`${data.phoneNumber} connected — calls now route to your agent.`);
      setAccountSid("");
      setAuthToken("");
      setPhoneNumber("");
      setLabel("");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e164: string) {
    if (!confirm(`Disconnect ${e164}? Calls to it will stop routing to your agent.`)) {
      return;
    }
    const res = await fetch(`/api/phone-numbers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Couldn't disconnect the number.");
      return;
    }
    toast.success(`${e164} disconnected.`);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-5">
      {/* Connect form */}
      <form
        onSubmit={handleConnect}
        className="glass-card space-y-unit-lg rounded-2xl p-unit-lg lg:col-span-3"
      >
        <div>
          <h2 className="text-headline-md text-headline-md text-on-surface">
            Connect your number
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Enter the credentials for a number you already own. We&rsquo;ll
            point its voice webhook at Omni AI &mdash; nothing else changes on
            your account.
          </p>
        </div>

        {/* Provider toggle */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Provider
          </Label>
          <div className="grid grid-cols-2 gap-unit-sm">
            {(["twilio", "signalwire"] as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-label-md font-semibold capitalize transition-all",
                  provider === p
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                {p === "signalwire" ? "SignalWire" : "Twilio"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-unit-md md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              {isTwilio ? "Account SID" : "Project ID"}
            </Label>
            <Input
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder={isTwilio ? "AC…" : "Project UUID"}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              {isTwilio ? "Auth Token" : "API Token"}
            </Label>
            <Input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder={isTwilio ? "Your Twilio auth token" : "PT…"}
              required
            />
          </div>
          {!isTwilio && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Space URL
              </Label>
              <Input
                value={spaceUrl}
                onChange={(e) => setSpaceUrl(e.target.value)}
                placeholder="myspace.signalwire.com"
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Phone Number
            </Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+17755999726"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Label (optional)
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Main dispatch line"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Answering Agent
            </Label>
            <Select
              value={agentId}
              onValueChange={(v) => setAgentId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    agents.length ? "Choose an agent" : "Create an agent first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Connecting…" : "Connect Number"}
          {!submitting && <Icon name="local_shipping" className="size-5" />}
        </button>
      </form>

      {/* Connected numbers */}
      <div className="lg:col-span-2">
        <div className="glass-card rounded-2xl p-unit-lg">
          <h3 className="mb-unit-md text-headline-md text-headline-md text-on-surface">
            Connected Numbers
          </h3>
          {numbers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant p-unit-lg text-center">
              <Icon
                name="call"
                className="mx-auto mb-unit-sm size-8 text-on-surface-variant"
              />
              <p className="text-body-md text-on-surface-variant">
                No numbers connected yet. Connect one to start receiving calls.
              </p>
            </div>
          ) : (
            <ul className="space-y-unit-sm">
              {numbers.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between rounded-xl border border-outline-variant p-unit-md"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-body-md font-semibold text-on-surface">
                      {n.e164}
                    </p>
                    <p className="truncate text-label-sm text-on-surface-variant">
                      {n.label ? `${n.label} · ` : ""}
                      {n.agentName ? `→ ${n.agentName}` : "No agent assigned"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id, n.e164)}
                    className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                    aria-label={`Disconnect ${n.e164}`}
                  >
                    <Icon name="delete" className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
