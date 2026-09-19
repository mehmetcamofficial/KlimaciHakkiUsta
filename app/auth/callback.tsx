import React, { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";

import { Button, Screen, State } from "@/components/ui/marketplace";
import { mapAuthCallbackError } from "@/lib/auth-errors";
import { parseAuthCallbackUrl } from "@/lib/auth-deep-link";
import { useAuth } from "@/lib/auth";

/**
 * Landing point for every Supabase Auth email link (signup confirmation and
 * password recovery both redirect here — see AUTH_CALLBACK_URL in
 * lib/auth.tsx). Parses the tokens out of the raw deep-link URL itself
 * (see lib/auth-deep-link.ts for why) rather than relying on Expo Router's
 * route params, establishes the session, then routes onward:
 * signup confirmation -> home; password recovery -> the new-password screen.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { establishSessionFromTokens } = useAuth();
  const url = Linking.useURL();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!url) return;
    let active = true;

    async function process(currentUrl: string) {
      const parsed = parseAuthCallbackUrl(currentUrl);

      if (parsed.error || parsed.errorCode) {
        if (active) {
          setStatus("error");
          setMessage(mapAuthCallbackError(parsed));
        }
        return;
      }

      if (!parsed.accessToken || !parsed.refreshToken) {
        if (active) {
          setStatus("error");
          setMessage("Bağlantı geçersiz veya eksik. Lütfen tekrar deneyin.");
        }
        return;
      }

      const result = await establishSessionFromTokens(parsed.accessToken, parsed.refreshToken);
      if (!active) return;

      if (result.error) {
        setStatus("error");
        setMessage(result.error);
        return;
      }

      if (parsed.type === "recovery") {
        router.replace("/reset-password");
      } else {
        router.replace("/");
      }
    }

    void process(url);

    return () => {
      active = false;
    };
  }, [url, establishSessionFromTokens, router]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      {status === "processing" ? (
        <State loading title="Doğrulanıyor…" />
      ) : (
        <>
          <State title={message} />
          <Button title="Giriş ekranına dön" onPress={() => router.replace("/sign-in")} />
        </>
      )}
    </Screen>
  );
}
