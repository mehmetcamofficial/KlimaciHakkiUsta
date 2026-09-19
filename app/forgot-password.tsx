import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Brand, Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { ui } from "@/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const canSubmit = isValidEmail(email) && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Supabase itself never reveals whether the address has an account, and
    // neither does this screen — the copy below is intentionally
    // conditional ("if you have an account") rather than confirming one
    // exists.
    setSent(true);
  }

  return (
    <Screen width="narrow">
      <Stack.Screen options={{ title: "Şifremi Unuttum" }} />
      <Brand />
      <Text style={ui.title}>Şifrenizi mi unuttunuz?</Text>
      <Text style={ui.body}>
        E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
      </Text>

      {sent ? (
        <>
          <State title="Eğer bu e-posta adresiyle bir hesabınız varsa, şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin." />
          <Button title="Giriş ekranına dön" onPress={() => router.replace("/sign-in")} />
        </>
      ) : (
        <>
          <TextInput
            accessibilityLabel="E-posta"
            editable={!submitting}
            style={ui.input}
            placeholder="E-posta"
            placeholderTextColor="#576872"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {!!error && <State title={error} />}

          <Button
            title={submitting ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
            onPress={submit}
            loading={submitting}
            disabled={!canSubmit}
          />

          <Button
            title="Giriş ekranına dön"
            secondary
            disabled={submitting}
            onPress={() => router.replace("/sign-in")}
          />
        </>
      )}
    </Screen>
  );
}
