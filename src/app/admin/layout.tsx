import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui-custom/icon";

// Platform super-admin area — cross-tenant, always live.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Gate: must be signed in AND a platform super admin. Anyone else is
  // bounced to their own dashboard — the route never reveals it exists.
  if (!user) redirect("/login");
  if (!user.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-4 md:px-margin-desktop">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
              <Icon name="shield" className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-label-md font-bold leading-none text-on-surface">
                Omni AI — Platform Admin
              </p>
              <p className="mt-0.5 text-label-sm text-on-surface-variant">
                Signed in as {user.name}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <Icon name="arrow_back" className="size-4" />
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-container-max px-4 py-unit-xl md:px-margin-desktop">
        {children}
      </main>
    </div>
  );
}
