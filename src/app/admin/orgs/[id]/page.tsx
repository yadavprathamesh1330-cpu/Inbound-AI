import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui-custom/icon";
import { AdminCreditPanel } from "./admin-credit-panel";
import { AdminOrgControls } from "./admin-org-controls";

export const dynamic = "force-dynamic";

const BLENDED_COST_PER_MINUTE = 0.1;
const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  owner_operator: "Owner-Operator",
  fleet: "Fleet",
  enterprise: "Enterprise",
};

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}
function date(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function dateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      agents: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, status: true, industry: true },
      },
      phoneNumbers: {
        select: { id: true, e164: true, label: true },
      },
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });

  if (!org) notFound();

  const [callAgg, callCount, leadCount, recentCalls] = await Promise.all([
    prisma.call.aggregate({
      where: { organizationId: id },
      _sum: { durationSeconds: true },
    }),
    prisma.call.count({ where: { organizationId: id } }),
    prisma.lead.count({ where: { organizationId: id } }),
    prisma.call.findMany({
      where: { organizationId: id },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        callerPhone: true,
        callerName: true,
        status: true,
        durationSeconds: true,
        startedAt: true,
      },
    }),
  ]);

  const minutes =
    Math.round(((callAgg._sum.durationSeconds ?? 0) / 60) * 10) / 10;
  const estCost = minutes * BLENDED_COST_PER_MINUTE;

  const usageStats = [
    { label: "Calls", value: callCount, icon: "podcasts" },
    { label: "Minutes", value: minutes, icon: "timer" },
    { label: "Leads", value: leadCount, icon: "person_add" },
    { label: "Est. Cost", value: usd(estCost), icon: "payments" },
  ];

  const suspended = org.status === "SUSPENDED";

  return (
    <div className="space-y-unit-xl">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="mb-unit-md inline-flex items-center gap-1.5 text-label-md text-on-surface-variant transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" className="size-4" />
          All organizations
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline-lg text-headline-lg text-on-surface">
            {org.name}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-label-sm font-semibold ${
              suspended
                ? "bg-error/10 text-error"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {suspended ? "Suspended" : "Active"}
          </span>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm font-semibold text-on-surface-variant">
            {PLAN_LABELS[org.plan] ?? org.plan}
          </span>
        </div>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          Joined {date(org.createdAt)} · {org.telephonyProvider
            ? `Telephony: ${org.telephonyProvider}`
            : "No telephony connected"}
          {org.website ? ` · ${org.website}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Left: usage + tables */}
        <div className="space-y-unit-xl lg:col-span-2">
          {/* Usage stats */}
          <div className="grid grid-cols-2 gap-gutter sm:grid-cols-4">
            {usageStats.map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-unit-md">
                <Icon name={s.icon} className="mb-2 size-5 text-secondary" />
                <p className="text-xl font-bold text-on-surface md:text-2xl">
                  {s.value}
                </p>
                <p className="text-label-sm text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Users */}
          <Section title="Users" count={org.users.length} icon="group">
            <SimpleTable
              head={["Name", "Email", "Role", "Joined"]}
              rows={org.users.map((u) => [
                u.name,
                u.email,
                u.role,
                date(u.createdAt),
              ])}
              empty="No users."
            />
          </Section>

          {/* Agents */}
          <Section title="AI Agents" count={org.agents.length} icon="smart_toy">
            <SimpleTable
              head={["Name", "Industry", "Status"]}
              rows={org.agents.map((a) => [
                a.name,
                a.industry ?? "—",
                a.status,
              ])}
              empty="No agents created."
            />
          </Section>

          {/* Phone numbers */}
          <Section
            title="Phone Numbers"
            count={org.phoneNumbers.length}
            icon="smartphone"
          >
            <SimpleTable
              head={["Number", "Label"]}
              rows={org.phoneNumbers.map((p) => [p.e164, p.label ?? "—"])}
              empty="No numbers connected."
            />
          </Section>

          {/* Recent calls */}
          <Section title="Recent Calls" count={callCount} icon="podcasts">
            <SimpleTable
              head={["Caller", "Status", "Duration", "When"]}
              rows={recentCalls.map((c) => [
                c.callerName ?? c.callerPhone,
                c.status,
                c.durationSeconds ? `${c.durationSeconds}s` : "—",
                dateTime(c.startedAt),
              ])}
              empty="No calls yet."
            />
          </Section>

          {/* Credit ledger */}
          <Section
            title="Credit History"
            count={org.creditTransactions.length}
            icon="payments"
          >
            <SimpleTable
              head={["Change", "Balance After", "Reason", "By", "When"]}
              rows={org.creditTransactions.map((t) => [
                `${t.amountCents >= 0 ? "+" : "−"}${usd(Math.abs(t.amountCents) / 100)}`,
                usd(t.balanceAfter / 100),
                t.reason ?? "—",
                t.createdBy,
                dateTime(t.createdAt),
              ])}
              empty="No credit adjustments yet."
            />
          </Section>
        </div>

        {/* Right: credit + controls */}
        <div className="space-y-unit-lg lg:sticky lg:top-24 lg:self-start">
          <AdminCreditPanel orgId={org.id} initialCents={org.creditCents} />
          <AdminOrgControls
            orgId={org.id}
            initialStatus={org.status}
            initialPlan={org.plan}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count: number;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-outline-variant px-unit-lg py-unit-md">
        <Icon name={icon} className="size-5 text-secondary" />
        <h2 className="text-headline-md text-headline-md text-on-surface">
          {title}
        </h2>
        <span className="ml-1 rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant">
          {count}
        </span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function SimpleTable({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-unit-lg py-unit-lg text-center text-body-md text-on-surface-variant">
        {empty}
      </p>
    );
  }
  return (
    <table className="w-full min-w-[520px] text-left">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm uppercase tracking-wider text-on-surface-variant">
          {head.map((h) => (
            <th key={h} className="px-unit-lg py-unit-sm font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className="border-b border-outline-variant/50 text-body-md text-on-surface"
          >
            {r.map((cell, j) => (
              <td key={j} className="px-unit-lg py-unit-md">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
