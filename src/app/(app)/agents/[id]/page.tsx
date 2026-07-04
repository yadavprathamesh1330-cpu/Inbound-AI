import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { StatCard } from "@/components/ui-custom/stat-card";
import { Icon } from "@/components/ui-custom/icon";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentDetailActions } from "./agent-detail-actions";
import { TestAgentPanel } from "./test-agent-panel";
import { OnCallPanel } from "./on-call-panel";

function objectiveLabel(objective: string) {
  return objective
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, organizationId: user.orgId },
    include: {
      phoneNumbers: true,
    },
  });

  if (!agent) notFound();

  const [calls, leadsCount, wonLeadsCount] = await Promise.all([
    prisma.call.findMany({
      where: { agentId: agent.id },
      select: { durationSeconds: true, status: true },
    }),
    prisma.lead.count({ where: { agentId: agent.id } }),
    prisma.lead.count({ where: { agentId: agent.id, stage: "WON" } }),
  ]);

  const completedDurations = calls
    .map((c) => c.durationSeconds)
    .filter((d): d is number => typeof d === "number");
  const avgDurationSeconds = completedDurations.length
    ? Math.round(
        completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length,
      )
    : 0;
  const avgMinutes = Math.floor(avgDurationSeconds / 60);
  const avgSeconds = avgDurationSeconds % 60;

  const leadConversionRate = leadsCount > 0 ? (wonLeadsCount / leadsCount) * 100 : 0;

  const statusStyles: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-600",
    DRAFT: "bg-slate-100 text-slate-600",
    PAUSED: "bg-amber-50 text-amber-600",
  };

  return (
    <div id="test">
      <PageHeader
        title={agent.name}
        subtitle={`${agent.businessName}${agent.industry ? ` • ${agent.industry}` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusStyles[agent.status]}`}
            >
              {agent.status}
            </span>
            <AgentDetailActions agentId={agent.id} status={agent.status} />
          </div>
        }
      />
      <PageTransition>
        <div className="mb-8 flex items-center gap-2 text-label-sm text-outline">
          <Link href="/agents" className="hover:text-on-surface">
            AI Agents
          </Link>
          <Icon name="chevron_right" className="size-3.5" />
          <span className="font-medium text-on-surface">{agent.name}</span>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Calls"
            value={agent.totalCalls}
            icon="call"
          />
          <StatCard
            label="Success Rate"
            value={agent.successRate}
            suffix="%"
            decimals={1}
            icon="task_alt"
          />
          <StatCard
            label="Avg Duration"
            value={avgMinutes}
            suffix={`m ${avgSeconds}s`}
            icon="timer"
          />
          <StatCard
            label="Lead Conversion"
            value={leadConversionRate}
            suffix="%"
            decimals={1}
            icon="trending_up"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <GlassCard className="p-6">
              <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">
                Agent Configuration
              </h3>
              <dl className="space-y-3 text-label-md">
                <div className="flex justify-between border-b border-outline-variant/30 py-2">
                  <dt className="text-on-surface-variant">Voice</dt>
                  <dd className="font-bold text-on-surface">
                    {agent.voiceGender === "FEMALE" ? "Female" : "Male"} ·{" "}
                    {agent.voiceAccent[0] + agent.voiceAccent.slice(1).toLowerCase()} ·{" "}
                    {agent.speakingSpeed.toFixed(2)}x
                  </dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/30 py-2">
                  <dt className="text-on-surface-variant">Timezone</dt>
                  <dd className="font-bold text-on-surface">{agent.timezone}</dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/30 py-2">
                  <dt className="text-on-surface-variant">Languages</dt>
                  <dd className="font-bold text-on-surface">
                    {agent.languages.join(", ").toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-outline-variant/30 py-2">
                  <dt className="text-on-surface-variant">Phone Numbers</dt>
                  <dd className="font-bold text-on-surface">
                    {agent.phoneNumbers.length > 0
                      ? agent.phoneNumbers.map((p) => p.e164).join(", ")
                      : "Not connected"}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-on-surface-variant">Objectives</dt>
                  <dd className="flex flex-wrap justify-end gap-1.5">
                    {agent.objectives.length > 0 ? (
                      agent.objectives.map((o) => (
                        <span
                          key={o}
                          className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant"
                        >
                          {objectiveLabel(o)}
                        </span>
                      ))
                    ) : (
                      <span className="font-bold text-on-surface">None set</span>
                    )}
                  </dd>
                </div>
              </dl>
            </GlassCard>
          </div>

          <TestAgentPanel
            agentId={agent.id}
            greeting={agent.greeting}
            systemPrompt={agent.systemPrompt}
            hasPhoneNumber={agent.phoneNumbers.length > 0}
          />

          <OnCallPanel agentId={agent.id} initialOnCallPhone={agent.onCallPhone} />
        </div>
      </PageTransition>
    </div>
  );
}
