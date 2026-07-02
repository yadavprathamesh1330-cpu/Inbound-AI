import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhoneNumbersClient } from "./phone-numbers-client";

export const dynamic = "force-dynamic";

export default async function PhoneNumbersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [numbers, agents, organization] = await Promise.all([
    prisma.phoneNumber.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { id: true, name: true } } },
    }),
    prisma.agent.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { telephonyProvider: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Phone Numbers"
        subtitle="Connect a number you already own on Twilio or SignalWire so your AI agent can start answering calls."
      />
      <PageTransition>
        <PhoneNumbersClient
          numbers={numbers.map((n) => ({
            id: n.id,
            e164: n.e164,
            label: n.label,
            agentId: n.agentId,
            agentName: n.agent?.name ?? null,
            createdAt: n.createdAt.toISOString(),
          }))}
          agents={agents}
          connectedProvider={organization?.telephonyProvider ?? null}
        />
      </PageTransition>
    </div>
  );
}
