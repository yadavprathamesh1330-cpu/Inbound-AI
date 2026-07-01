import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { AgentsGridClient } from "./agents-grid-client";
import { CreateAgentButton } from "./create-agent-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="AI Agents"
        subtitle="Manage the voice agents handling calls for your organization."
        actions={<CreateAgentButton />}
      />
      <PageTransition>
        {agents.length === 0 ? (
          <EmptyState
            icon="smart_toy"
            title="No agents yet"
            description="Create your first AI voice agent to start handling calls automatically."
            action={<CreateAgentButton />}
          />
        ) : (
          <AgentsGridClient initialAgents={agents} />
        )}
      </PageTransition>
    </div>
  );
}
