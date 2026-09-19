import { Platform } from "react-native";
import * as Linking from "expo-linking";

/**
 * Single source of truth for where Supabase Auth emails (signup
 * confirmation, password recovery) should send the user back to.
 *
 * - Native, in a development build or a standalone build: Linking.createURL
 *   reads the app's own configured `scheme` (see app.json) and returns
 *   `ustayanimda://auth/callback`. **This does not work inside Expo Go** —
 *   Expo Go owns the `exp://` scheme and always substitutes its own proxy
 *   URL for `Linking.createURL()`'s output, no matter what `scheme` is
 *   configured, so a custom scheme never reaches Supabase's redirect
 *   allow-list intact. There is no code-level workaround for this; testing
 *   this flow for real requires a development build
 *   (`npx expo run:android` / `npx expo run:ios`, or an EAS development
 *   build) — see docs/validation/phase2.md.
 * - Web, running in an actual browser: the page's own current origin
 *   (`window.location.origin`) + `/auth/callback`. This is correct in local
 *   development (whatever host/port the dev server happens to be serving
 *   on that day) and in production (`https://ustayanimda.net.tr` once
 *   deployed) without ever hardcoding a host — there is deliberately no
 *   `localhost` fallback here.
 * - Web, with no `window` (Expo Router's static export prerenders pages in
 *   Node, outside a browser): falls back to `Linking.createURL()`, which
 *   degrades to a relative path. There is no session to redirect during
 *   prerendering, so this branch is only ever exercised at build time.
 */
export function getAuthCallbackUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }
  return Linking.createURL("/auth/callback");
}
