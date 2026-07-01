import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { KnowledgeBaseClient } from "./knowledge-base-client";

export default async function KnowledgeBasePage() {
  const user = await getCurrentUser();

  const [documents, agents] = user
    ? await Promise.all([
        prisma.knowledgeDocument.findMany({
          where: { organizationId: user.orgId },
          include: { agent: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.agent.findMany({
          where: { organizationId: user.orgId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        subtitle="Train your AI agents with custom data. Upload documents, sync live URLs, or add FAQs to expand your agent's expertise."
      />
      <PageTransition>
        <KnowledgeBaseClient initialDocuments={documents} agents={agents} />
      </PageTransition>
    </div>
  );
}
