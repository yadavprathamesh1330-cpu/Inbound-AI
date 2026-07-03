import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui-custom/icon";
import { OrgTable } from "./org-table";

// Rough blended cost per call-minute (telephony + STT + LLM + TTS) used only
// to give the platform owner an at-a-glance spend estimate. Not billing-grade.
const BLENDED_COST_PER_MINUTE = 0.1;

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}
function minutesFromSeconds(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

async function getPlatformStats() {
  const [
    orgCount,
    userCount,
    agentCount,
    activeAgentCount,
    phoneCount,
    callCount,
    callAgg,
    leadCount,
    orgs,
    callsByOrg,
    agentsByOrg,
    usersByOrg,
    leadsByOrg,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.agent.count(),
    prisma.agent.count({ where: { status: "PUBLISHED" } }),
    prisma.phoneNumber.count(),
    prisma.call.count(),
    prisma.call.aggregate({ _sum: { durationSeconds: true } }),
    prisma.lead.count(),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        creditCents: true,
        status: true,
        plan: true,
      },
    }),
    prisma.call.groupBy({
      by: ["organizationId"],
      _count: { _all: true },
      _sum: { durationSeconds: true },
    }),
    prisma.agent.groupBy({
      by: ["organizationId"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["organizationId"],
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["organizationId"],
      _count: { _all: true },
    }),
  ]);

  const totalSeconds = callAgg._sum.durationSeconds ?? 0;
  const totalMinutes = minutesFromSeconds(totalSeconds);
  const totalCost = totalMinutes * BLENDED_COST_PER_MINUTE;

  const callMap = new Map(
    callsByOrg.map((r) => [
      r.organizationId,
      { calls: r._count._all, seconds: r._sum.durationSeconds ?? 0 },
    ]),
  );
  const agentMap = new Map(agentsByOrg.map((r) => [r.organizationId, r._count._all]));
  const userMap = new Map(usersByOrg.map((r) => [r.organizationId, r._count._all]));
  const leadMap = new Map(leadsByOrg.map((r) => [r.organizationId, r._count._all]));

  const perOrg = orgs.map((o) => {
    const c = callMap.get(o.id) ?? { calls: 0, seconds: 0 };
    const minutes = minutesFromSeconds(c.seconds);
    return {
      id: o.id,
      name: o.name,
      createdAt: o.createdAt.toISOString(),
      users: userMap.get(o.id) ?? 0,
      agents: agentMap.get(o.id) ?? 0,
      leads: leadMap.get(o.id) ?? 0,
      calls: c.calls,
      minutes,
      cost: minutes * BLENDED_COST_PER_MINUTE,
      creditCents: o.creditCents,
      status: o.status,
      plan: o.plan,
    };
  });

  const totalCreditCents = orgs.reduce((sum, o) => sum + o.creditCents, 0);

  return {
    totals: {
      orgCount,
      userCount,
      agentCount,
      activeAgentCount,
      phoneCount,
      callCount,
      totalMinutes,
      totalCost,
      leadCount,
      totalCredits: totalCreditCents / 100,
    },
    perOrg,
  };
}

const STAT_CARDS: {
  key:
    | "orgCount"
    | "userCount"
    | "agentCount"
    | "callCount"
    | "totalMinutes"
    | "totalCost"
    | "leadCount"
    | "phoneCount"
    | "totalCredits";
  label: string;
  icon: string;
  fmt: "num" | "usd";
}[] = [
  { key: "orgCount", label: "Organizations", icon: "business", fmt: "num" },
  { key: "userCount", label: "Users", icon: "group", fmt: "num" },
  { key: "agentCount", label: "AI Agents", icon: "smart_toy", fmt: "num" },
  { key: "phoneCount", label: "Phone Numbers", icon: "call", fmt: "num" },
  { key: "callCount", label: "Total Calls", icon: "podcasts", fmt: "num" },
  { key: "totalMinutes", label: "Call Minutes", icon: "timer", fmt: "num" },
  { key: "leadCount", label: "Leads Captured", icon: "person_add", fmt: "num" },
  { key: "totalCredits", label: "Credits Outstanding", icon: "payments", fmt: "usd" },
];

export default async function AdminPage() {
  const { totals, perOrg } = await getPlatformStats();

  return (
    <div className="space-y-unit-xl">
      <div>
        <h1 className="text-headline-lg text-headline-lg text-on-surface">
          Platform Overview
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Every organization on Omni AI at a glance — usage, agents, and
          estimated spend across the whole platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-gutter md:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const value = totals[card.key];
          return (
            <div key={card.key} className="glass-card rounded-2xl p-unit-lg">
              <div className="mb-unit-md flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <Icon name={card.icon} className="size-5 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-on-surface md:text-3xl">
                {card.fmt === "usd" ? usd(value) : fmt(value)}
              </p>
              <p className="mt-1 text-label-md text-on-surface-variant">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Per-org table (searchable, links to detail) */}
      <OrgTable rows={perOrg} />
    </div>
  );
}
