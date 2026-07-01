import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [organization, notifications, apiKeys] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.orgId } }),
    prisma.notification.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.apiKey.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!organization) redirect("/onboarding");

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your organization, notifications, and API access."
      />
      <PageTransition>
        <SettingsClient
          organization={organization}
          initialNotifications={notifications}
          initialApiKeys={apiKeys}
        />
      </PageTransition>
    </div>
  );
}
