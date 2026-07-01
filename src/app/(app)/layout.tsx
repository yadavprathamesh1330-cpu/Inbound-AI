import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";

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

  return <AppShell user={user}>{children}</AppShell>;
}
