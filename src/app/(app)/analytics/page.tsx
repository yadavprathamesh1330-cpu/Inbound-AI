import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { AnalyticsChartsClient } from "./analytics-charts-client";
import type {
  AnalyticsAppointment,
  AnalyticsCall,
  AnalyticsLead,
} from "./types";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          subtitle="Deep-dive into your voice agent performance."
        />
        <EmptyState
          icon="bar_chart"
          title="Sign in required"
          description="Sign in to view analytics for your organization."
        />
      </div>
    );
  }

  const [calls, leads, appointments, agents] = await Promise.all([
    prisma.call.findMany({
      where: { organizationId: user.orgId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        durationSeconds: true,
        sentiment: true,
        agentId: true,
      },
      orderBy: { startedAt: "asc" },
    }),
    prisma.lead.findMany({
      where: { organizationId: user.orgId },
      select: {
        id: true,
        stage: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: { organizationId: user.orgId },
      select: {
        id: true,
        startsAt: true,
      },
    }),
    prisma.agent.findMany({
      where: { organizationId: user.orgId },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const agentNameById = new Map(agents.map((a) => [a.id, a.name]));

  const analyticsCalls: AnalyticsCall[] = calls.map((c) => ({
    id: c.id,
    status: c.status,
    startedAt: c.startedAt.toISOString(),
    durationSeconds: c.durationSeconds,
    sentiment: c.sentiment,
    agentId: c.agentId,
    agentName: agentNameById.get(c.agentId) ?? "Unknown",
  }));

  const analyticsLeads: AnalyticsLead[] = leads.map((l) => ({
    id: l.id,
    stage: l.stage,
    createdAt: l.createdAt.toISOString(),
  }));

  const analyticsAppointments: AnalyticsAppointment[] = appointments.map(
    (a) => ({
      id: a.id,
      startsAt: a.startsAt.toISOString(),
    }),
  );

  if (analyticsCalls.length === 0) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          subtitle="Deep-dive into your voice agent performance metrics, call trends, and lead conversion."
        />
        <EmptyState
          icon="bar_chart"
          title="No analytics yet"
          description="Once your agents start taking calls, call trends, peak hours, lead conversion, and appointment analytics will show up here."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep-dive into your voice agent performance metrics, call trends, and lead conversion."
      />
      <PageTransition>
        <AnalyticsChartsClient
          calls={analyticsCalls}
          leads={analyticsLeads}
          appointments={analyticsAppointments}
        />
      </PageTransition>
    </div>
  );
}
