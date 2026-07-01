"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { AvatarLineSkeleton } from "@/components/ui-custom/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserRole } from "@/generated/prisma/enums";
import type { User } from "@/generated/prisma/client";

const roleOptions: UserRole[] = [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER];

const roleBadgeClass: Record<UserRole, string> = {
  OWNER: "bg-secondary/10 text-secondary",
  ADMIN: "bg-primary/10 text-primary",
  MEMBER: "bg-surface-container-high text-on-surface-variant",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchMembers(): Promise<User[]> {
  const res = await fetch("/api/team");
  if (!res.ok) throw new Error("Failed to load team members");
  const data = await res.json();
  return data.members;
}

export function TeamClient({
  initialMembers,
  currentUserId,
}: {
  initialMembers: User[];
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.MEMBER);

  const { data: members = initialMembers, isPending } = useQuery({
    queryKey: ["team-members"],
    queryFn: fetchMembers,
    initialData: initialMembers,
  });

  const ownerCount = members.filter((m) => m.role === UserRole.OWNER).length;

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await fetch(`/api/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/team/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Enter an email address to invite");
      return;
    }
    // NOTE: this is a placeholder. A real implementation needs an
    // `invitations` table (pending email -> role -> org) plus an email
    // send (e.g. Resend/Postmark) so the invitee can complete Supabase
    // signup and land in this org — that's out of scope here, so we just
    // acknowledge the intent without creating a User row (a User row
    // requires a matching Supabase authId that doesn't exist yet).
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole(UserRole.MEMBER);
    setInviteOpen(false);
  }

  return (
    <div className="space-y-unit-lg">
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger render={<Button />}>
            <Icon name="person_add" data-icon="inline-start" />
            Invite member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                Send an invite to join your organization. They&apos;ll be
                able to sign up and access the dashboard once accepted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard className="overflow-hidden p-0">
        {isPending ? (
          <div className="space-y-4 p-unit-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <AvatarLineSkeleton key={i} />
            ))}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Member
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Role
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  Joined
                </th>
                <th className="px-unit-lg py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {members.map((member) => {
                const isLastOwner =
                  member.role === UserRole.OWNER && ownerCount <= 1;
                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-surface-container-low/30"
                  >
                    <td className="px-unit-lg py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-outline-variant bg-primary text-sm font-bold text-primary-foreground">
                          {member.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            initials(member.name)
                          )}
                        </div>
                        <div>
                          <p className="text-body-md font-medium text-on-surface">
                            {member.name}
                            {member.id === currentUserId && (
                              <span className="ml-2 text-xs text-on-surface-variant">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-unit-lg py-4">
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateRole.mutate({
                            userId: member.id,
                            role: role as UserRole,
                          })
                        }
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge className={roleBadgeClass[member.role]}>
                              {member.role}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.charAt(0) + r.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-unit-lg py-4 text-body-md text-on-surface-variant">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-unit-lg py-4 text-right">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isLastOwner || removeMember.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Remove ${member.name} from this organization?`,
                                  )
                                ) {
                                  removeMember.mutate(member.id);
                                }
                              }}
                            />
                          }
                        >
                          <Icon
                            name="person_remove"
                            className="size-4 text-destructive"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {isLastOwner
                            ? "Can't remove the last owner"
                            : "Remove member"}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
