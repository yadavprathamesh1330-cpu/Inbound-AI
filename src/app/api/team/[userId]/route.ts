import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

const patchSchema = z.object({
  role: z.enum(UserRole),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const member = await prisma.user.findFirst({
    where: { id: userId, organizationId: user.orgId },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Guard against demoting the last remaining OWNER in the org.
  if (member.role === UserRole.OWNER && parsed.data.role !== UserRole.OWNER) {
    const ownerCount = await prisma.user.count({
      where: { organizationId: user.orgId, role: UserRole.OWNER },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot change the role of the last owner" },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: member.id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const member = await prisma.user.findFirst({
    where: { id: userId, organizationId: user.orgId },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === UserRole.OWNER) {
    const ownerCount = await prisma.user.count({
      where: { organizationId: user.orgId, role: UserRole.OWNER },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last owner of the organization" },
        { status: 400 },
      );
    }
  }

  await prisma.user.delete({ where: { id: member.id } });

  return NextResponse.json({ success: true });
}
