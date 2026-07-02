import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  createAdminClient,
  createContextClient,
  resolveEnv,
  verifyCredentials,
} from "@supabase/server/core";
import type {
  AuthModeWithKey,
  SupabaseContext,
  SupabaseEnv,
} from "@supabase/server";

/**
 * Next.js adapter for @supabase/server, composed with @supabase/ssr per the
 * package's own SSR guide (docs/ssr-frameworks.md):
 *
 * - @supabase/ssr owns the cookie session lifecycle. Our middleware
 *   (src/lib/supabase/middleware.ts) already refreshes the access-token
 *   cookie on every request — required, or verifyCredentials would reject
 *   expired tokens.
 * - @supabase/server adds cryptographic JWT verification against the
 *   project's JWKS plus typed clients: an RLS-scoped `supabase` and a
 *   service-role `supabaseAdmin`.
 *
 * Env resolution accepts both this SDK's standard names and the NEXT_PUBLIC_*
 * names the rest of the app already uses:
 *   SUPABASE_URL              ?? NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_PUBLISHABLE_KEY  ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *                             ?? NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SECRET_KEY       ?? SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_JWKS / SUPABASE_JWKS_URL (else the project's well-known JWKS URL)
 */
function resolveOmniEnv():
  | { data: SupabaseEnv; error: null }
  | { data: null; error: Error } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  const overrides: Partial<SupabaseEnv> = {
    url: url ?? undefined,
    publishableKeys: publishableKey ? { default: publishableKey } : undefined,
    secretKeys: secretKey ? { default: secretKey } : undefined,
  };

  // resolveEnv reads SUPABASE_JWKS / SUPABASE_JWKS_URL natively (lazy fetch,
  // cached by jose). When neither is set, point at the project's well-known
  // endpoint so `auth: "user"` verification works with zero extra config.
  if (!process.env.SUPABASE_JWKS && !process.env.SUPABASE_JWKS_URL && url) {
    overrides.jwks = new URL(`${url}/auth/v1/.well-known/jwks.json`);
  }

  return resolveEnv(overrides);
}

export interface CreateContextOptions {
  auth?: AuthModeWithKey | AuthModeWithKey[];
}

/**
 * Builds a verified SupabaseContext for Server Components and Route Handlers.
 *
 * Usage:
 *   const { data: ctx, error } = await createSupabaseContext();       // auth: "user"
 *   const { data: ctx, error } = await createSupabaseContext({ auth: "none" });
 *
 * On success `ctx` carries:
 *   supabase       — RLS-scoped client (anonymous unless authMode is "user")
 *   supabaseAdmin  — service-role client, bypasses RLS (lazy: only errors if
 *                    accessed without SUPABASE_SECRET_KEY configured)
 *   userClaims     — JWT-derived identity (id, email, role) or null
 *   jwtClaims      — full verified JWT claims or null
 *   authMode       — which auth mode matched
 */
export async function createSupabaseContext(
  options: CreateContextOptions = {},
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  const { data: env, error: envError } = resolveOmniEnv();
  if (envError || !env) {
    return {
      data: null,
      error:
        envError ??
        new Error(
          "Supabase isn't configured — set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (see .env.example)",
        ),
    };
  }

  // Read the @supabase/ssr session cookie. Middleware has already refreshed
  // the access token, so getSession() returns a fresh JWT (verified below —
  // we never trust the unverified session by itself).
  const cookieStore = await cookies();
  const ssrClient = createServerClient(env.url, env.publishableKeys.default, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options: cookieOptions } of cookiesToSet) {
            cookieStore.set(name, value, cookieOptions);
          }
        } catch {
          // Server Components can't write cookies — middleware handles it.
        }
      },
    },
  });

  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  const token = session?.access_token ?? null;

  const { data: auth, error } = await verifyCredentials(
    { token, apikey: null },
    { auth: options.auth ?? "user", env },
  );
  if (error || !auth) {
    return { data: null, error: error ?? new Error("Unauthorized") };
  }

  const supabase = createContextClient({ auth: { token: auth.token }, env });

  return {
    data: {
      supabase,
      // Lazy so user-scoped routes keep working before SUPABASE_SECRET_KEY
      // is configured; accessing it without the key throws a clear error.
      get supabaseAdmin() {
        return createAdminClient({ env });
      },
      userClaims: auth.userClaims,
      jwtClaims: auth.jwtClaims,
      authMode: auth.authMode,
    },
    error: null,
  };
}
