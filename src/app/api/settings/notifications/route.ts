import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}

/** Marks every notification for this org as read. */
export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { organizationId: user.orgId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
