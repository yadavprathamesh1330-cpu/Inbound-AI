import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadsBoardClient } from "./leads-board-client";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/onboarding");
  }

  const leads = await prisma.lead.findMany({
    where: { organizationId: user.orgId },
    include: {
      agent: { select: { id: true, name: true } },
      call: {
        select: {
          id: true,
          summary: true,
          sentiment: true,
          durationSeconds: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Leads Pipeline"
        subtitle="Manage and track leads captured by your AI Voice Agents"
      />
      <PageTransition>
        {leads.length === 0 ? (
          <EmptyState
            icon="group"
            title="No leads yet"
            description="Leads captured by your AI Voice Agents during calls will show up here, organized by pipeline stage."
          />
        ) : (
          <LeadsBoardClient initialLeads={leads} />
        )}
      </PageTransition>
    </div>
  );
}
