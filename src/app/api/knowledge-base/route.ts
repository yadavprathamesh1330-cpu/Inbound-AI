import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KnowledgeSourceType, KnowledgeStatus } from "@/generated/prisma/client";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  sourceType: z.enum(KnowledgeSourceType),
  // WEBSITE: the URL to crawl. FAQ: the schema has no dedicated
  // question/answer columns yet, so the answer text is stashed in
  // `sourceUrl` as a stopgap until a proper `content`/chunk table exists.
  sourceUrl: z.string().trim().min(1).optional(),
  agentId: z.string().trim().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.knowledgeDocument.findMany({
    where: { organizationId: user.orgId },
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

// NOTE: this only creates the KnowledgeDocument row (status PENDING). Real
// file bytes are never persisted here yet — wiring Supabase Storage/S3 for
// the actual PDF/DOCX/TXT uploads, and a website crawler + embeddings
// pipeline to turn PENDING -> INDEXING -> READY, are follow-up work.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, sourceType, sourceUrl, agentId } = parsed.data;

  if (agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId: user.orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
  }

  const document = await prisma.knowledgeDocument.create({
    data: {
      title,
      sourceType,
      sourceUrl: sourceUrl || null,
      status: KnowledgeStatus.PENDING,
      organizationId: user.orgId,
      agentId: agentId || null,
    },
    include: { agent: { select: { id: true, name: true } } },
  });

  return NextResponse.json(document, { status: 201 });
}
