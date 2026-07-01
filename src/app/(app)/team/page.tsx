import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const members = await prisma.user.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage who has access to your organization's AI agents and data."
      />
      <PageTransition>
        <TeamClient initialMembers={members} currentUserId={user.id} />
      </PageTransition>
    </div>
  );
}
