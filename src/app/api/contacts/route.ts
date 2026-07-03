import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, toContactData } from "@/lib/contact-input";

export const runtime = "nodejs";

/** POST /api/contacts — create a contact for the current org. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid contact" },
      { status: 400 },
    );
  }

  const data = toContactData(parsed.data);
  const contact = await prisma.contact.create({
    data: {
      name: data.name!,
      type: parsed.data.type ?? "BROKER",
      company: data.company ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      mcNumber: data.mcNumber ?? null,
      dotNumber: data.dotNumber ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      notes: data.notes ?? null,
      organization: { connect: { id: user.orgId } },
    },
  });

  return NextResponse.json({ ok: true, contact });
}
