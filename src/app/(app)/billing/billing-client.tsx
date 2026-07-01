"use client";

import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import type { Invoice, Subscription } from "@/generated/prisma/client";

const statusBadgeClass: Record<SubscriptionStatus, string> = {
  TRIALING: "bg-secondary/10 text-secondary",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAST_DUE: "bg-amber-50 text-amber-700",
  CANCELED: "bg-destructive/10 text-destructive",
};

const invoiceStatusBadgeClass: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  open: "bg-amber-50 text-amber-700",
  void: "bg-surface-container-high text-on-surface-variant",
  uncollectible: "bg-destructive/10 text-destructive",
};

const planTiers: {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  features: string[];
}[] = [
  {
    plan: SubscriptionPlan.STARTER,
    name: "Starter",
    price: "$99/mo",
    description: "For small teams testing their first AI agent.",
    features: [
      "1,000 minutes / month",
      "1 AI agent",
      "Standard voice library",
      "Email support",
    ],
  },
  {
    plan: SubscriptionPlan.GROWTH,
    name: "Growth",
    price: "$399/mo",
    description: "For growing teams running agents across the business.",
    features: [
      "10,000 minutes / month",
      "Up to 10 AI agents",
      "Premium voice library",
      "Integrations (Slack, Sheets, Calendar)",
      "Priority support",
    ],
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    name: "Enterprise",
    price: "Custom",
    description: "For organizations that need scale, SSO, and SLAs.",
    features: [
      "Unlimited minutes",
      "Unlimited AI agents",
      "Custom voice cloning",
      "Dedicated success manager",
      "SSO & audit logs",
    ],
  },
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function BillingClient({
  subscription,
  invoices,
}: {
  subscription: Subscription | null;
  invoices: Invoice[];
}) {
  const percentUsed = subscription
    ? Math.min(
        100,
        Math.round((subscription.minutesUsed / subscription.minutesIncluded) * 100),
      )
    : 0;

  return (
    <div className="space-y-unit-xl">
      {/* Current plan card */}
      <GlassCard className="p-unit-lg">
        {subscription ? (
          <div className="flex flex-col gap-unit-lg md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-headline-md font-headline-md text-on-surface">
                  {subscription.plan.charAt(0) +
                    subscription.plan.slice(1).toLowerCase()}{" "}
                  plan
                </h3>
                <Badge className={statusBadgeClass[subscription.status]}>
                  {subscription.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Current period: {formatDate(subscription.currentPeriodStart)} –{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div className="min-w-[280px]">
              <div className="mb-2 flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant">Minutes used</span>
                <span className="font-medium text-on-surface">
                  {subscription.minutesUsed.toLocaleString()} /{" "}
                  {subscription.minutesIncluded.toLocaleString()}
                </span>
              </div>
              <Progress value={percentUsed} />
              <p className="mt-1 text-xs text-on-surface-variant">
                {percentUsed}% of included minutes used this period
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="payments"
            title="No active subscription"
            description="This organization doesn't have a subscription yet."
          />
        )}
      </GlassCard>

      {/* Plan comparison */}
      <div>
        <h3 className="mb-unit-md text-headline-md font-headline-md text-on-surface">
          Plans
        </h3>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {planTiers.map((tier) => {
            const isCurrent = subscription?.plan === tier.plan;
            return (
              <GlassCard
                key={tier.plan}
                className={cn(
                  "flex flex-col p-unit-lg",
                  isCurrent && "border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[18px] font-headline-md font-bold text-on-surface">
                    {tier.name}
                  </h4>
                  {isCurrent && (
                    <Badge className="bg-primary/10 text-primary">
                      Current plan
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-display-xl-mobile font-bold text-on-surface">
                  {tier.price}
                </p>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {tier.description}
                </p>
                <ul className="mt-unit-md flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-body-md text-on-surface"
                    >
                      <Icon
                        name="check"
                        className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="mt-unit-lg block">
                        <Button
                          className="w-full"
                          variant={isCurrent ? "outline" : "default"}
                          disabled
                        >
                          {isCurrent ? "Current plan" : "Upgrade"}
                        </Button>
                      </span>
                    }
                  />
                  <TooltipContent>
                    Stripe checkout isn&apos;t connected yet — upgrades aren&apos;t
                    available in this environment.
                  </TooltipContent>
                </Tooltip>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="mb-unit-md text-headline-md font-headline-md text-on-surface">
          Invoices
        </h3>
        {invoices.length === 0 ? (
          <EmptyState
            icon="description"
            title="No invoices yet"
            description="Invoices will appear here once your first billing period closes."
          />
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                  <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Issued
                  </th>
                  <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Amount
                  </th>
                  <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Status
                  </th>
                  <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    <span className="sr-only">PDF</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition-colors hover:bg-surface-container-low/30"
                  >
                    <td className="px-unit-lg py-4 text-body-md text-on-surface">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="px-unit-lg py-4 text-body-md text-on-surface">
                      {formatCents(invoice.amountCents, invoice.currency)}
                    </td>
                    <td className="px-unit-lg py-4">
                      <Badge
                        className={
                          invoiceStatusBadgeClass[invoice.status] ??
                          "bg-surface-container-high text-on-surface-variant"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-unit-lg py-4 text-right">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-label-sm font-label-sm text-secondary hover:underline"
                        >
                          <Icon name="download" className="size-4" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-label-sm text-on-surface-variant">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
