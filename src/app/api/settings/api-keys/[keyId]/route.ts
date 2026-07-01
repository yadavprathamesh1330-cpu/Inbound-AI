import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Soft-revokes an API key by stamping `revokedAt` rather than deleting it. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyId } = await params;

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, organizationId: user.orgId },
  });
  if (!key) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const revoked = await prisma.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ apiKey: revoked });
}
