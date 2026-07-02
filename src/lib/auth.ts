import "server-only";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/admin";
import type { CurrentUser } from "@/lib/types";

/**
 * Returns the signed-in Supabase auth user, or null if Supabase isn't
 * configured yet or there's no session.
 */
export async function getSupabaseUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolves the current app user (Prisma User + Organization), the shape
 * every authenticated page renders against.
 *
 * - When Supabase isn't configured yet, falls back to the seeded demo
 *   organization's owner so the UI is reviewable before credentials are
 *   wired up (see src/lib/supabase/middleware.ts for the matching gate).
 * - When Supabase is configured but the signed-in auth user has no
 *   matching Organization yet, returns null so callers can route them
 *   into onboarding.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Touch a request-scoped dynamic API so every page/route calling this
  // opts out of static prerendering — this resolves per-request/per-user
  // data and must never be cached at build time.
  await cookies();

  if (!isSupabaseConfigured()) {
    const devUser = await prisma.user.findFirst({
      where: { role: "OWNER" },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    if (!devUser) return null;
    return {
      id: devUser.id,
      name: devUser.name,
      email: devUser.email,
      role: devUser.role,
      avatarUrl: devUser.avatarUrl,
      orgId: devUser.organizationId,
      orgName: devUser.organization.name,
      isSuperAdmin: isSuperAdmin(devUser.email),
    };
  }

  const authUser = await getSupabaseUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { organization: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    orgId: user.organizationId,
    orgName: user.organization.name,
    isSuperAdmin: isSuperAdmin(user.email),
  };
}
