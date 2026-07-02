import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * DELETE /api/phone-numbers/[id] — removes a connected number from this org.
 *
 * This only deletes our record + routing link; it does NOT release the number
 * from the customer's Twilio/SignalWire account (they keep ownership there).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const phone = await prisma.phoneNumber.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!phone) {
    return NextResponse.json({ error: "Number not found." }, { status: 404 });
  }

  await prisma.phoneNumber.delete({ where: { id: phone.id } });
  return NextResponse.json({ ok: true });
}
