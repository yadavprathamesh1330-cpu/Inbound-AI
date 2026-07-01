import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/auth";

const bodySchema = z.object({
  orgName: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().min(1),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "workspace"
  );
}

export async function POST(request: Request) {
  const authUser = await getSupabaseUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { organization: true },
  });
  if (existing) {
    return NextResponse.json({ organizationId: existing.organizationId });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orgName, website, timezone } = parsed.data;

  const baseSlug = slugify(orgName);
  const slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;

  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      website: website || null,
      timezone,
      users: {
        create: {
          authId: authUser.id,
          email: authUser.email ?? "",
          name:
            (authUser.user_metadata?.name as string | undefined) ??
            authUser.email ??
            "Owner",
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIALING",
          minutesIncluded: 500,
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  return NextResponse.json({ organizationId: organization.id });
}
