export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  orgId: string;
  orgName: string;
  /** Platform-level super admin (see src/lib/admin.ts), not org-scoped. */
  isSuperAdmin: boolean;
}
