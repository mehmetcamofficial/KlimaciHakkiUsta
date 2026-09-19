import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Brand, Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { ui } from "@/theme";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace("/");
  }

  return (
    <Screen width="narrow">
      <Stack.Screen options={{ title: "Giriş Yap" }} />
      <Brand />
      <Text style={ui.title}>Tekrar hoş geldiniz</Text>
      <Text style={ui.body}>Taleplerinizi görmek için giriş yapın.</Text>

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
      <TextInput
        accessibilityLabel="Şifre"
        editable={!submitting}
        style={ui.input}
        placeholder="Şifre"
        placeholderTextColor="#576872"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {!!error && <State title={error} />}

      <Button
        title={submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
      />

      <Button
        title="Şifremi unuttum"
        secondary
        disabled={submitting}
        onPress={() => router.push("/forgot-password")}
      />

      <Button
        title="Hesabınız yok mu? Kayıt olun"
        secondary
        disabled={submitting}
        onPress={() => router.push("/sign-up")}
      />
    </Screen>
  );
}
