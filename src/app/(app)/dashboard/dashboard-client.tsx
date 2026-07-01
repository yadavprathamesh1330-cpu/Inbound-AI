"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { StatCard } from "@/components/ui-custom/stat-card";
import { VoicePulse } from "@/components/ui-custom/voice-pulse";
import { ProgressRing } from "@/components/ui-custom/progress-ring";
import { AnimatedCounter } from "@/components/ui-custom/animated-counter";
import { Icon } from "@/components/ui-custom/icon";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Fab } from "@/components/ui-custom/fab";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AgentSummary {
  id: string;
  name: string;
  role: string;
  successRate: number;
  totalCalls: number;
}

interface CallSummary {
  id: string;
  callerName: string;
  callerPhone: string;
  startedAt: string;
  durationSeconds: number | null;
  summary: string | null;
  leadScore: number | null;
  status: string;
}

interface DashboardClientProps {
  greeting: string;
  firstName: string;
  dateRangeLabel: string;
  stats: {
    callsToday: number;
    callsTrendPct: number | null;
    activeAiCalls: number;
    newLeadsToday: number;
    leadsTrendPct: number | null;
    upcomingAppointments: number;
  };
  revenue: {
    amount: number;
    goal: number;
    pct: number;
  };
  aiSuccessRate: number;
  minutes: {
    used: number;
    included: number;
    periodEnd: Date | null;
  };
  agents: AgentSummary[];
  calls: CallSummary[];
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function scoreClasses(score: number | null) {
  if (score === null) return "bg-surface-container-high text-on-surface-variant";
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-surface-container-high text-on-surface-variant";
  return "bg-red-50 text-red-700";
}

const statusConfig: Record<
  string,
  { label: string; dot: string; pill: string }
> = {
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-600",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  IN_PROGRESS: {
    label: "In-Progress",
    dot: "bg-blue-600",
    pill: "bg-blue-50 text-blue-700 border-blue-100 animate-pulse",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-red-600",
    pill: "bg-red-50 text-red-700 border-red-100",
  },
  MISSED: {
    label: "Missed",
    dot: "bg-red-600",
    pill: "bg-red-50 text-red-700 border-red-100",
  },
  VOICEMAIL: {
    label: "Voicemail",
    dot: "bg-on-surface-variant",
    pill: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
  },
};

export function DashboardClient({
  greeting,
  firstName,
  dateRangeLabel,
  stats,
  revenue,
  aiSuccessRate,
  minutes,
  agents,
  calls,
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={`${greeting}, ${firstName}`}
          subtitle="Here's what's happening with your AI agents today."
          className="mb-0"
        />
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-white p-2 shadow-sm">
          <Icon name="calendar_today" className="ml-2 size-4 text-outline" />
          <span className="pr-4 text-label-sm font-label-sm text-on-surface-variant">
            {dateRangeLabel}
          </span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mb-unit-xl mt-unit-xl grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label="Calls Today"
            value={stats.callsToday}
            icon="call"
            trend={
              stats.callsTrendPct !== null
                ? {
                    direction: stats.callsTrendPct >= 0 ? "up" : "down",
                    label: `${stats.callsTrendPct >= 0 ? "+" : ""}${stats.callsTrendPct}% vs yesterday`,
                  }
                : { direction: "neutral", label: "No calls yesterday" }
            }
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="flex items-start justify-between p-unit-md">
            <div>
              <p className="text-label-sm font-medium text-on-surface-variant">
                Active AI Calls
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-display-xl-mobile font-bold text-on-surface">
                  <AnimatedCounter value={stats.activeAiCalls} />
                </h3>
                <VoicePulse className="mb-2" size={16} />
              </div>
              <p className="mt-2 text-xs font-medium text-on-surface-variant">
                Real-time processing
              </p>
            </div>
            <div className="rounded-xl bg-secondary/10 p-3">
              <Icon name="graphic_eq" className="size-5 text-secondary" />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            label="New Leads"
            value={stats.newLeadsToday}
            icon="person_add"
            trend={
              stats.leadsTrendPct !== null
                ? {
                    direction: "up",
                    label: `+${stats.leadsTrendPct}% this week`,
                  }
                : { direction: "neutral", label: "No leads last week" }
            }
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            label="Appointments"
            value={stats.upcomingAppointments}
            icon="calendar_month"
            trend={{ direction: "neutral", label: "Ready for review" }}
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 grid grid-cols-1 gap-gutter md:grid-cols-3">
          <GlassCard className="flex flex-1 flex-col justify-between p-unit-md">
            <div>
              <div className="flex justify-between">
                <h5 className="text-label-sm font-bold text-on-surface-variant">
                  Revenue Generated
                </h5>
                <Icon name="payments" className="size-4 text-secondary" />
              </div>
              <h4 className="mt-2 text-headline-md font-extrabold text-on-surface">
                <AnimatedCounter
                  value={revenue.amount}
                  prefix="$"
                  decimals={2}
                />
              </h4>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-lg bg-surface-container-low">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${revenue.pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-outline">
                {revenue.pct}% OF MONTHLY GOAL
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant">
                ${(revenue.goal / 1000).toFixed(0)}k Target
              </span>
            </div>
          </GlassCard>

          <GlassCard className="flex-1 p-unit-md">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="text-label-sm font-bold text-on-surface-variant">
                  AI Success Rate
                </h5>
                <h4 className="mt-2 text-headline-md font-extrabold text-emerald-600">
                  {aiSuccessRate}%
                </h4>
                <p className="mt-1 text-[10px] font-medium text-outline">
                  NLU Confidence Index
                </p>
              </div>
              <ProgressRing value={aiSuccessRate} size={64} />
            </div>
          </GlassCard>

          <GlassCard className="flex-1 p-unit-md">
            <div className="flex justify-between">
              <div>
                <h5 className="text-label-sm font-bold text-on-surface-variant">
                  Minutes Used
                </h5>
                <h4 className="mt-2 text-headline-md font-extrabold text-on-surface">
                  {minutes.used.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-outline">
                    / {minutes.included >= 1000
                      ? `${Math.round(minutes.included / 1000)}k`
                      : minutes.included}
                  </span>
                </h4>
              </div>
              <Icon name="timer" className="size-4 text-secondary" />
            </div>
            <p className="mt-2 text-xs italic text-on-surface-variant">
              {minutes.periodEnd
                ? `Refreshes ${refreshLabel(minutes.periodEnd)}`
                : "No active subscription period"}
            </p>
          </GlassCard>
        </div>

        <GlassCard className="col-span-12 p-unit-lg">
          <div className="mb-unit-lg flex items-center justify-between">
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Top Performing AI Agents
            </h4>
            <Link
              href="/agents"
              className="text-label-sm font-bold text-secondary hover:underline"
            >
              View All Agents
            </Link>
          </div>
          {agents.length === 0 ? (
            <EmptyState
              icon="smart_toy"
              title="No agents yet"
              description="Create your first AI agent to start taking calls."
            />
          ) : (
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-primary-foreground">
                      {initials(agent.name)}
                    </div>
                    <div>
                      <h6 className="font-bold text-on-surface">
                        {agent.name}
                      </h6>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">
                        Success Rate
                      </span>
                      <span className="font-bold text-emerald-600">
                        {agent.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">
                        Total Calls
                      </span>
                      <span className="font-bold text-on-surface">
                        {agent.totalCalls.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="col-span-12 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-outline-variant/30 p-unit-lg">
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Recent Calls
            </h4>
            <div className="flex gap-2">
              <button className="rounded-lg border border-outline-variant/30 p-2 text-outline transition-colors hover:text-primary">
                <Icon name="filter_list" className="size-4" />
              </button>
              <button className="rounded-lg border border-outline-variant/30 p-2 text-outline transition-colors hover:text-primary">
                <Icon name="download" className="size-4" />
              </button>
            </div>
          </div>

          {calls.length === 0 ? (
            <EmptyState
              icon="call"
              title="No calls yet"
              description="Calls handled by your AI agents will show up here."
              className="border-0"
            />
          ) : (
            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Caller
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Time
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Summary
                    </th>
                    <th className="px-6 py-4 text-center text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Score
                    </th>
                    <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-outline">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {calls.map((call) => {
                    const status =
                      statusConfig[call.status] ?? statusConfig.COMPLETED;
                    return (
                      <tr
                        key={call.id}
                        className="group transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-body-md font-bold text-on-surface">
                              {call.callerName}
                            </span>
                            <span className="font-mono text-xs text-outline">
                              {call.callerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                          {formatTime(call.startedAt)}
                        </td>
                        <td className="px-6 py-4 text-body-md text-on-surface-variant">
                          {formatDuration(call.durationSeconds)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="max-w-xs truncate text-label-sm text-on-surface-variant">
                            {call.summary ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                "rounded px-2 py-1 text-[10px] font-bold",
                                scoreClasses(call.leadScore),
                              )}
                            >
                              {call.leadScore !== null
                                ? String(call.leadScore).padStart(2, "0")
                                : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                              status.pill,
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                status.dot,
                              )}
                            />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <Fab
        icon="add"
        label="Create agent"
        onClick={() => router.push("/agents")}
      />
    </PageTransition>
  );
}

function refreshLabel(periodEnd: Date) {
  const end = new Date(periodEnd);
  const now = new Date();
  const days = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}
