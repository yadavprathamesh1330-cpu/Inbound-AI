import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateAgentScript } from "@/lib/services/openai";
import { MissingCredentialError } from "@/lib/services/errors";

export const runtime = "nodejs";

const schema = z.object({
  businessName: z.string().optional(),
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  instruction: z.string().max(500).optional(),
});

/**
 * POST /api/agents/generate-prompt
 *
 * "Write with AI" helper — turns the business info a user has entered into a
 * ready-to-use system prompt + spoken greeting for their voice agent.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const script = await generateAgentScript(parsed.data);
    if (!script.systemPrompt) {
      return NextResponse.json(
        { error: "Couldn't generate a prompt — please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, ...script });
  } catch (err) {
    if (err instanceof MissingCredentialError) {
      return NextResponse.json(
        { error: "AI writing isn't available yet (OpenAI not configured)." },
        { status: 501 },
      );
    }
    console.error("[generate-prompt] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the prompt." },
      { status: 500 },
    );
  }
}
