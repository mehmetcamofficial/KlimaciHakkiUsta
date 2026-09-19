export interface AuthCallbackResult {
  accessToken: string | null;
  refreshToken: string | null;
  /** e.g. "signup", "recovery", "magiclink", "invite". */
  type: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

function parseParams(segment: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!segment) return params;
  for (const pair of segment.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    try {
      const key = decodeURIComponent(pair.slice(0, eq));
      const value = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, " "));
      params[key] = value;
    } catch {
      // Malformed percent-encoding in one pair shouldn't take down parsing
      // of the rest of the URL.
    }
  }
  return params;
}

/**
 * Parses a Supabase Auth deep-link callback URL — native deep links deliver
 * the full raw URL string (unlike a browser, nothing strips the fragment),
 * and Supabase's implicit flow puts tokens after `#`, while error responses
 * sometimes use `?` — so both are parsed and merged rather than trusting
 * one or the other. No `URL`/`URLSearchParams` global is assumed available;
 * this is intentionally dependency-free so it stays testable in isolation
 * and works identically on every platform (native, web, test harness).
 */
export function parseAuthCallbackUrl(url: string): AuthCallbackResult {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";
  const queryEnd = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : url.length;
  const query = queryIndex >= 0 ? url.slice(queryIndex + 1, queryEnd) : "";

  const merged = { ...parseParams(query), ...parseParams(fragment) };

  return {
    accessToken: merged.access_token ?? null,
    refreshToken: merged.refresh_token ?? null,
    type: merged.type ?? null,
    error: merged.error ?? null,
    errorCode: merged.error_code ?? null,
    errorDescription: merged.error_description ?? null,
  };
}
