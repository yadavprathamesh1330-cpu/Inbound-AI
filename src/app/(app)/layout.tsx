import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Every route under (app) renders per-user, per-org live data — never
// statically prerender it.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/onboarding");
  }

  const unreadNotificationCount = await prisma.notification.count({
    where: { organizationId: user.orgId, read: false },
  });

  return (
    <AppShell user={user} unreadNotificationCount={unreadNotificationCount}>
      {children}
    </AppShell>
  );
}
