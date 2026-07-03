import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { Icon } from "@/components/ui-custom/icon";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "./billing-client";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  owner_operator: "Owner-Operator",
  fleet: "Fleet",
  enterprise: "Enterprise",
};

function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const [subscription, invoices, organization] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: user.orgId } }),
    prisma.invoice.findMany({
      where: { organizationId: user.orgId },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { creditCents: true, plan: true },
    }),
  ]);

  const credits = organization?.creditCents ?? 0;
  const lowBalance = credits <= 0;
  const estMinutes = Math.round(credits / 100 / 0.1);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription plan and view past invoices."
      />
      <PageTransition>
        {/* Credit balance */}
        <div className="glass-card mb-unit-lg flex flex-col gap-unit-md rounded-2xl p-unit-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-unit-md">
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                lowBalance ? "bg-error/10" : "bg-emerald-500/10"
              }`}
            >
              <Icon
                name="payments"
                className={`size-6 ${lowBalance ? "text-error" : "text-emerald-600"}`}
              />
            </div>
            <div>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Credit Balance · {PLAN_LABELS[organization?.plan ?? "trial"]} plan
              </p>
              <p
                className={`text-3xl font-bold ${
                  lowBalance ? "text-error" : "text-on-surface"
                }`}
              >
                {usd(credits)}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                ≈ {estMinutes} call-minutes remaining
              </p>
            </div>
          </div>
          {lowBalance && (
            <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-label-md text-error">
              Balance is empty — top up to keep your agents answering calls.
            </div>
          )}
        </div>

        <BillingClient subscription={subscription} invoices={invoices} />
      </PageTransition>
    </div>
  );
}
