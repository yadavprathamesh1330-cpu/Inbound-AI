// Supabase Edge Function (Deno) — deploy with: supabase functions deploy api
//
// On the Supabase platform SUPABASE_URL / SUPABASE_PUBLISHABLE_KEYS /
// SUPABASE_SECRET_KEYS / SUPABASE_JWKS are injected automatically, so
// withSupabase needs zero env config here.
//
// auth: "user" requires a valid user JWT; the platform-level JWT check stays
// on too (verify_jwt = true in ../../config.toml). Only set it to false for
// non-"user" auth modes ("publishable" / "secret" / "none").
import { withSupabase } from "npm:@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    // RLS-scoped — this user only sees rows their policies allow.
    const { data, error } = await ctx.supabase.from("leads").select();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data);
  }),
};
