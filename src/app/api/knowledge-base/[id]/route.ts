import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KnowledgeStatus } from "@/generated/prisma/client";

// Re-index: flips the document back to INDEXING, then to READY a moment
// later. There's no real vector/embeddings pipeline wired up yet, so this
// is a simulated delay rather than an actual re-chunk + re-embed job -
// swap this out once the embeddings pipeline (chunking, vector store
// upserts) exists.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.knowledgeDocument.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await prisma.knowledgeDocument.update({
    where: { id },
    data: { status: KnowledgeStatus.INDEXING },
  });

  // Simulated indexing delay - stands in for the real embeddings job.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const document = await prisma.knowledgeDocument.update({
    where: { id },
    data: {
      status: KnowledgeStatus.READY,
      chunkCount: Math.max(1, Math.floor(Math.random() * 40) + 1),
    },
    include: { agent: { select: { id: true, name: true } } },
  });

  return NextResponse.json(document);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.knowledgeDocument.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await prisma.knowledgeDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
