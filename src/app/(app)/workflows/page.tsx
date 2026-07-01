import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkflowCard } from "./workflow-card";

export default async function WorkflowsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "asc" },
    include: {
      integrations: {
        include: { integration: true },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Workflows"
        subtitle="A read-only view of each agent's call-routing rules and connected integrations."
      />
      <PageTransition>
        {agents.length === 0 ? (
          <EmptyState
            icon="account_tree"
            title="No agents yet"
            description="Create an AI agent to define transfer rules, business rules, and workflow integrations."
          />
        ) : (
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
            {agents.map((agent) => (
              <WorkflowCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </PageTransition>
    </div>
  );
}
