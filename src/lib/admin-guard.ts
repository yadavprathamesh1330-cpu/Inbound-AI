import "server-only";
import { getCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/types";

/**
 * Guard for admin API routes. Returns the current user only if they're a
 * platform super admin, else null — callers should return 401/403 without
 * leaking whether the resource exists. Kept separate from admin.ts (which
 * stays a pure, dependency-free helper that auth.ts imports) to avoid a
 * circular import.
 */
export async function requireSuperAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !user.isSuperAdmin) return null;
  return user;
}
