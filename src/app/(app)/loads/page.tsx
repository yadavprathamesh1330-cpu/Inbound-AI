import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoadsBoardClient, type BoardLoad } from "./loads-board-client";

export const dynamic = "force-dynamic";

export default async function LoadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [loads, agents] = await Promise.all([
    prisma.load.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { id: true, name: true } } },
    }),
    prisma.agent.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const boardLoads: BoardLoad[] = loads.map((l) => ({
    id: l.id,
    status: l.status,
    reference: l.reference,
    originCity: l.originCity,
    originState: l.originState,
    destCity: l.destCity,
    destState: l.destState,
    equipment: l.equipment,
    weightLbs: l.weightLbs,
    commodity: l.commodity,
    rateCents: l.rateCents,
    pickupDate: l.pickupDate ? l.pickupDate.toISOString() : null,
    deliveryDate: l.deliveryDate ? l.deliveryDate.toISOString() : null,
    brokerName: l.brokerName,
    brokerMc: l.brokerMc,
    brokerPhone: l.brokerPhone,
    rateConUrl: l.rateConUrl,
    notes: l.notes,
    agentId: l.agentId,
    agentName: l.agent?.name ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Dispatch Board"
        subtitle="Every load your team and AI dispatcher book — track lane, rate, and status from New to Delivered."
      />
      <PageTransition>
        <LoadsBoardClient initialLoads={boardLoads} agents={agents} />
      </PageTransition>
    </div>
  );
}
