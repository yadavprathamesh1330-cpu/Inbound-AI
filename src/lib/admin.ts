import "server-only";

/**
 * Platform super-admin gate.
 *
 * Super admins are the platform *owner(s)* — distinct from an Organization's
 * OWNER role (which is tenant-scoped). They can see cross-tenant data in
 * /admin. Membership is controlled by the SUPER_ADMIN_EMAILS env var
 * (comma-separated, case-insensitive) rather than a DB column, so it can't be
 * escalated from inside the app and needs no migration to change.
 */
export function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return superAdminEmails().includes(email.toLowerCase());
}
