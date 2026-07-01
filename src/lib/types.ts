export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  orgId: string;
  orgName: string;
}
