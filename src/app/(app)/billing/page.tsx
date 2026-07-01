import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: user.orgId } }),
    prisma.invoice.findMany({
      where: { organizationId: user.orgId },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription plan and view past invoices."
      />
      <PageTransition>
        <BillingClient subscription={subscription} invoices={invoices} />
      </PageTransition>
    </div>
  );
}
