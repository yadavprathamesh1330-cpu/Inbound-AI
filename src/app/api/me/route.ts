import { createSupabaseContext } from "@/lib/supabase/context";

/**
 * GET /api/me — returns the verified identity of the signed-in user.
 *
 * Demonstrates the @supabase/server context: the JWT from the session cookie
 * is cryptographically verified against the project JWKS before the handler
 * logic runs; `ctx.supabase` is RLS-scoped to this user.
 */
export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ auth: "user" });

  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  return Response.json({
    user: ctx.userClaims,
    authMode: ctx.authMode,
  });
}
