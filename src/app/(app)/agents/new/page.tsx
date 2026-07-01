import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAgentWizard } from "./create-agent-wizard";

export default async function NewAgentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const integrations = await prisma.integration.findMany({
    where: { organizationId: user.orgId },
    orderBy: { provider: "asc" },
  });

  return <CreateAgentWizard integrations={integrations} />;
}
