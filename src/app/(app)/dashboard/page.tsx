import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/app/(app)/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/onboarding");
  }

  const organizationId = user.orgId;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [
    callsToday,
    callsYesterday,
    activeAiCalls,
    newLeadsToday,
    newLeadsLastWeek,
    upcomingAppointments,
    subscription,
    agents,
    recentCalls,
    completedCallsWithScore,
  ] = await Promise.all([
    prisma.call.count({
      where: { organizationId, startedAt: { gte: startOfToday } },
    }),
    prisma.call.count({
      where: {
        organizationId,
        startedAt: { gte: startOfYesterday, lt: startOfToday },
      },
    }),
    prisma.call.count({
      where: { organizationId, status: "IN_PROGRESS" },
    }),
    prisma.lead.count({
      where: { organizationId, createdAt: { gte: startOfToday } },
    }),
    prisma.lead.count({
      where: { organizationId, createdAt: { gte: startOfWeek } },
    }),
    prisma.appointment.count({
      where: { organizationId, startsAt: { gte: now } },
    }),
    prisma.subscription.findUnique({ where: { organizationId } }),
    prisma.agent.findMany({
      where: { organizationId },
      orderBy: { successRate: "desc" },
      take: 4,
    }),
    prisma.call.findMany({
      where: { organizationId },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    prisma.call.findMany({
      where: { organizationId, leadScore: { not: null } },
      select: { leadScore: true },
    }),
  ]);

  const callsTrendPct =
    callsYesterday > 0
      ? Math.round(((callsToday - callsYesterday) / callsYesterday) * 100)
      : null;

  const leadsTrendPct =
    newLeadsLastWeek > 0
      ? Math.round((newLeadsToday / Math.max(newLeadsLastWeek, 1)) * 100)
      : null;

  const avgLeadScore =
    completedCallsWithScore.length > 0
      ? completedCallsWithScore.reduce(
          (sum, c) => sum + (c.leadScore ?? 0),
          0,
        ) / completedCallsWithScore.length
      : 0;
  const aiSuccessRate = Math.round(avgLeadScore * 10) / 10;

  // Simple, presentable monthly revenue goal: derive a figure from minutes
  // used so the widget reflects real subscription data without a Stripe
  // integration in place yet.
  const revenueGenerated = subscription ? subscription.minutesUsed * 3.4 : 0;
  const monthlyGoal = 20000;
  const revenuePct = Math.min(
    100,
    Math.round((revenueGenerated / monthlyGoal) * 100),
  );

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  const dateRangeLabel = `${startOfWeek.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <DashboardClient
      greeting={greeting}
      firstName={firstName}
      dateRangeLabel={dateRangeLabel}
      stats={{
        callsToday,
        callsTrendPct,
        activeAiCalls,
        newLeadsToday,
        leadsTrendPct,
        upcomingAppointments,
      }}
      revenue={{
        amount: revenueGenerated,
        goal: monthlyGoal,
        pct: revenuePct,
      }}
      aiSuccessRate={aiSuccessRate}
      minutes={{
        used: subscription?.minutesUsed ?? 0,
        included: subscription?.minutesIncluded ?? 0,
        periodEnd: subscription?.currentPeriodEnd ?? null,
      }}
      agents={agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.objectives[0]
          ? formatObjective(agent.objectives[0])
          : agent.businessName,
        successRate: agent.successRate,
        totalCalls: agent.totalCalls,
      }))}
      calls={recentCalls.map((call) => ({
        id: call.id,
        callerName: call.callerName ?? "Anonymous",
        callerPhone: call.callerPhone,
        startedAt: call.startedAt.toISOString(),
        durationSeconds: call.durationSeconds,
        summary: call.summary,
        leadScore: call.leadScore,
        status: call.status,
      }))}
    />
  );
}

function formatObjective(objective: string) {
  return objective
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
