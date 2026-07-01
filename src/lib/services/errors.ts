/**
 * Typed error thrown by every service in `src/lib/services/*` when a
 * required credential/env var isn't set.
 *
 * Callers (route handlers, `call-processing.ts`) should catch this
 * specifically and either:
 *   - return a 501 Not Implemented with a clear message (HTTP boundary), or
 *   - log a warning and skip the step gracefully (background processing),
 *
 * rather than fabricating a fake "success" response. This keeps it obvious
 * in every environment (including this one, which has zero real provider
 * keys) exactly what is/isn't wired up.
 */
export class MissingCredentialError extends Error {
  /** The env var name that was missing, e.g. "OPENAI_API_KEY". */
  public readonly envVar: string;
  /** The provider/service this credential belongs to, e.g. "OpenAI". */
  public readonly provider: string;

  constructor(provider: string, envVar: string) {
    super(
      `${provider} is not configured: missing required environment variable "${envVar}". ` +
        `Set it in .env to enable ${provider} integration.`,
    );
    this.name = "MissingCredentialError";
    this.envVar = envVar;
    this.provider = provider;
  }
}

/**
 * Reads `process.env[name]`, throwing a `MissingCredentialError` if unset
 * or empty. Centralizes the "fail loudly, don't fake it" contract used by
 * every service module.
 */
export function requireEnv(name: string, provider: string): string {
  const value = process.env[name];
  if (!value) {
    throw new MissingCredentialError(provider, name);
  }
  return value;
}
