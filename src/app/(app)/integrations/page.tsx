import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { IntegrationProvider, IntegrationStatus } from "@/generated/prisma/client";
import { IntegrationsClient } from "./integrations-client";

// All providers the enum supports, so a card renders (as DISCONNECTED) even
// if the org has no Integration row for it yet - the seed data already has
// all 7, but new orgs won't until they connect something.
const ALL_PROVIDERS = Object.values(IntegrationProvider);

export default async function IntegrationsPage() {
  const user = await getCurrentUser();

  const integrations = user
    ? await prisma.integration.findMany({
        where: { organizationId: user.orgId },
      })
    : [];

  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  // Providers without a row yet (new orgs) render as a not-yet-persisted
  // DISCONNECTED placeholder; the row is created for real on first Connect
  // via the upsert in the PATCH route handler.
  const cards = ALL_PROVIDERS.map((provider) => {
    const existing = byProvider.get(provider);
    if (existing) {
      return { ...existing, config: existing.config as Record<string, unknown> | null };
    }
    return {
      id: `unconnected-${provider}`,
      provider,
      status: IntegrationStatus.DISCONNECTED,
      config: null as Record<string, unknown> | null,
      connectedAt: null,
      organizationId: user?.orgId ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect Omni AI with your existing software stack to automate your workflow."
      />
      <PageTransition>
        <IntegrationsClient initialIntegrations={cards} />
      </PageTransition>
    </div>
  );
}
