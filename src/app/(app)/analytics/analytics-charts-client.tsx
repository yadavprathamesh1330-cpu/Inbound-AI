"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { StatCard } from "@/components/ui-custom/stat-card";
import { ProgressRing } from "@/components/ui-custom/progress-ring";
import { Icon } from "@/components/ui-custom/icon";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  AnalyticsAppointment,
  AnalyticsCall,
  AnalyticsLead,
} from "./types";

const ROYAL_BLUE = "#0051d5";
const EMERALD = "#10b981";
const SLATE = "#76777d";

const LEAD_FUNNEL_STAGES = ["NEW", "QUALIFIED", "APPOINTMENT", "WON"] as const;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(d: Date) {
  const copy = startOfDay(d);
  const day = copy.getDay();
  // Week starts on Monday
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const WEEK_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

type Granularity = "daily" | "weekly" | "monthly";

function buildCallSeries(calls: AnalyticsCall[], granularity: Granularity) {
  const now = new Date();

  if (granularity === "daily") {
    const days = 14;
    const buckets = new Map<string, number>();
    const order: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = startOfDay(d).toISOString();
      buckets.set(key, 0);
      order.push(key);
    }
    for (const call of calls) {
      const key = startOfDay(new Date(call.startedAt)).toISOString();
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return order.map((key) => ({
      label: DAY_LABEL.format(new Date(key)),
      calls: buckets.get(key) ?? 0,
    }));
  }

  if (granularity === "weekly") {
    const weeks = 8;
    const buckets = new Map<string, number>();
    const order: string[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = startOfWeek(d).toISOString();
      if (!buckets.has(key)) {
        buckets.set(key, 0);
        order.push(key);
      }
    }
    for (const call of calls) {
      const key = startOfWeek(new Date(call.startedAt)).toISOString();
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return order.map((key) => ({
      label: `Wk of ${WEEK_LABEL.format(new Date(key))}`,
      calls: buckets.get(key) ?? 0,
    }));
  }

  // monthly
  const months = 6;
  const buckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = startOfMonth(d).toISOString();
    buckets.set(key, 0);
    order.push(key);
  }
  for (const call of calls) {
    const key = startOfMonth(new Date(call.startedAt)).toISOString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return order.map((key) => ({
    label: MONTH_LABEL.format(new Date(key)),
    calls: buckets.get(key) ?? 0,
  }));
}

function buildHourlyDistribution(calls: AnalyticsCall[]) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }));
  for (const call of calls) {
    const hour = new Date(call.startedAt).getHours();
    hours[hour].calls += 1;
  }
  return hours.map((h) => ({
    label:
      h.hour === 0
        ? "12am"
        : h.hour < 12
          ? `${h.hour}am`
          : h.hour === 12
            ? "12pm"
            : `${h.hour - 12}pm`,
    calls: h.calls,
  }));
}

function buildFunnel(leads: AnalyticsLead[]) {
  const counts = new Map<string, number>();
  for (const stage of LEAD_FUNNEL_STAGES) counts.set(stage, 0);
  let lost = 0;
  for (const lead of leads) {
    if (lead.stage === "LOST") {
      lost += 1;
      continue;
    }
    counts.set(lead.stage, (counts.get(lead.stage) ?? 0) + 1);
  }
  return {
    funnel: LEAD_FUNNEL_STAGES.map((stage) => ({
      stage,
      label:
        stage === "NEW"
          ? "New"
          : stage === "QUALIFIED"
            ? "Qualified"
            : stage === "APPOINTMENT"
              ? "Appointment"
              : "Won",
      count: counts.get(stage) ?? 0,
    })),
    lost,
  };
}

function buildAppointmentSeries(appointments: AnalyticsAppointment[]) {
  const now = new Date();
  const days = 14;
  const buckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const key = startOfDay(d).toISOString();
    buckets.set(key, 0);
    order.push(key);
  }
  for (const appt of appointments) {
    const key = startOfDay(new Date(appt.startsAt)).toISOString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return order.map((key) => ({
    label: DAY_LABEL.format(new Date(key)),
    appointments: buckets.get(key) ?? 0,
    isFuture: new Date(key) > startOfDay(now),
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-sm shadow-md">
      <p className="font-bold text-on-surface">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-on-surface-variant">
          {p.name}: <span className="font-bold text-on-surface">{p.value}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsChartsClient({
  calls,
  leads,
  appointments,
}: {
  calls: AnalyticsCall[];
  leads: AnalyticsLead[];
  appointments: AnalyticsAppointment[];
}) {
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === "COMPLETED").length;
  const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

  const totalDurationSeconds = calls.reduce(
    (sum, c) => sum + (c.durationSeconds ?? 0),
    0,
  );
  const callsWithDuration = calls.filter(
    (c) => c.durationSeconds != null,
  ).length;
  const avgDurationSeconds =
    callsWithDuration > 0 ? totalDurationSeconds / callsWithDuration : 0;

  const wonLeads = leads.filter((l) => l.stage === "WON").length;
  const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;

  const callSeries = useMemo(
    () => buildCallSeries(calls, granularity),
    [calls, granularity],
  );
  const hourlySeries = useMemo(() => buildHourlyDistribution(calls), [calls]);
  const { funnel, lost } = useMemo(() => buildFunnel(leads), [leads]);
  const appointmentSeries = useMemo(
    () => buildAppointmentSeries(appointments),
    [appointments],
  );
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.startsAt) >= startOfDay(new Date()),
  ).length;

  const peakHour = hourlySeries.reduce(
    (max, h) => (h.calls > max.calls ? h : max),
    hourlySeries[0],
  );

  const maxFunnelCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div className="grid grid-cols-12 gap-gutter">
      {/* Key metric cards */}
      <div className="col-span-12 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
        <StatCard
          label="Total Call Volume"
          value={totalCalls}
          icon="call"
        />
        <StatCard
          label="Lead Conversion Rate"
          value={Number(conversionRate.toFixed(1))}
          suffix="%"
          decimals={1}
          icon="check_circle"
        />
        <StatCard
          label="Avg. Call Duration"
          value={Number((avgDurationSeconds / 60).toFixed(1))}
          suffix=" min"
          decimals={1}
          icon="avg_time"
        />
      </div>

      {/* Calls over time */}
      <GlassCard className="col-span-12 p-unit-lg lg:col-span-9">
        <div className="mb-unit-lg flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[18px] font-bold text-on-surface">
              Calls Over Time
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Call volume bucketed by {granularity} granularity
            </p>
          </div>
          <Tabs
            value={granularity}
            onValueChange={(v) => setGranularity(v as Granularity)}
          >
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={callSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ROYAL_BLUE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={ROYAL_BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: SLATE }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: SLATE }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="calls"
                name="Calls"
                stroke={ROYAL_BLUE}
                strokeWidth={2}
                fill="url(#callsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Peak hours */}
      <GlassCard className="col-span-12 p-unit-lg lg:col-span-6">
        <div className="mb-unit-lg flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-on-surface">
              Peak Call Hours
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Call volume by hour of day
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
            Peak {peakHour?.label ?? "--"}
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: SLATE }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: SLATE }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="calls" name="Calls" radius={[4, 4, 0, 0]}>
                {hourlySeries.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.calls === peakHour?.calls && entry.calls > 0
                        ? ROYAL_BLUE
                        : "#c0c6db"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Lead conversion funnel */}
      <GlassCard className="col-span-12 p-unit-lg lg:col-span-6">
        <div className="mb-unit-lg flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-on-surface">
            Lead Conversion Funnel
          </h3>
          {lost > 0 && (
            <span className="rounded-md bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive">
              {lost} lost
            </span>
          )}
        </div>
        <div className="space-y-4">
          {funnel.map((stage) => (
            <div key={stage.stage} className="space-y-1.5">
              <div className="flex justify-between text-label-sm">
                <span className="font-bold text-on-surface">{stage.label}</span>
                <span className="font-bold text-secondary">{stage.count}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-low">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    stage.stage === "WON" ? "bg-emerald-500" : "bg-secondary",
                  )}
                  style={{
                    width: `${Math.max((stage.count / maxFunnelCount) * 100, stage.count > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* AI success rate */}
      <GlassCard className="col-span-12 flex flex-col items-center justify-center gap-4 p-unit-lg md:col-span-4">
        <h3 className="self-start text-[18px] font-bold text-on-surface">
          AI Success Rate
        </h3>
        <ProgressRing value={successRate} size={140} strokeWidth={4} color={EMERALD} />
        <p className="text-center text-label-sm text-on-surface-variant">
          {completedCalls} of {totalCalls} calls completed successfully
        </p>
      </GlassCard>

      {/* Appointments */}
      <GlassCard className="col-span-12 p-unit-lg md:col-span-8">
        <div className="mb-unit-lg flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-on-surface">
              Appointments
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Daily appointment volume, last 7 &amp; next 7 days
            </p>
          </div>
          <div className="text-right">
            <p className="text-headline-md font-bold text-on-surface">
              {upcomingAppointments}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Upcoming
            </p>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: SLATE }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: SLATE }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="appointments" name="Appointments" radius={[4, 4, 0, 0]}>
                {appointmentSeries.map((entry, i) => (
                  <Cell key={i} fill={entry.isFuture ? ROYAL_BLUE : "#c0c6db"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Revenue proxy */}
      <GlassCard className="col-span-12 p-unit-lg">
        <div className="flex flex-col items-start justify-between gap-unit-lg md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-secondary/10 p-3">
              <Icon name="payments" className="size-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">
                Revenue Signal (Won Leads)
              </h3>
              <p className="max-w-xl text-label-sm text-on-surface-variant">
                No billing/invoice event is tied to individual leads yet, so
                we use closed-won leads as an honest proxy for pipeline
                revenue impact instead of fabricating a dollar figure.
                Connect Stripe invoice line items to a lead/deal size field
                for true revenue tracking.
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-display-xl-mobile font-bold text-on-surface">
              {wonLeads}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Won Leads
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
