import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CallsTableClient } from "./calls-table-client";

export default async function CallsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const calls = await prisma.call.findMany({
    where: { organizationId: user.orgId },
    orderBy: { startedAt: "desc" },
    include: { agent: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Call Logs"
        subtitle="Every conversation your AI agents have handled, with transcripts and outcomes."
      />
      <PageTransition>
        {calls.length === 0 ? (
          <EmptyState
            icon="call"
            title="No calls yet"
            description="Once your agents start taking calls, they'll show up here with full transcripts, summaries, and lead scores."
          />
        ) : (
          <CallsTableClient initialCalls={calls} />
        )}
      </PageTransition>
    </div>
  );
}
