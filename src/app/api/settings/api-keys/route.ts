import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ apiKeys });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prefix = "oai_live_";
  const secret = randomBytes(24).toString("base64url");
  const fullKey = `${prefix}${secret}`;

  // NOTE: sha256 is a placeholder hash for this demo environment only.
  // Production should hash API key secrets with a proper KDF (bcrypt or
  // argon2) rather than a fast general-purpose hash like sha256.
  const keyHash = createHash("sha256").update(fullKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: user.orgId,
      name: parsed.data.name,
      keyPrefix: prefix,
      keyHash,
    },
  });

  // The full secret is only ever returned once, at creation time.
  return NextResponse.json({ apiKey, secret: fullKey });
}
