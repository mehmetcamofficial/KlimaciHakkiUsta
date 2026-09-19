import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Brand, Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { isValidPassword, passwordsMatch as checkPasswordsMatch } from "@/lib/validation";
import { ui } from "@/theme";

/**
 * Reached only after app/auth/callback.tsx has already turned a password
 * recovery link into an active session via establishSessionFromTokens — so
 * this screen checks for that session itself rather than using
 * RequireAuth's generic "please sign in" prompt, which would be misleading
 * here (the user didn't fail to sign in; their recovery link may simply be
 * old/already used).
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session, isLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const passwordsMatch = checkPasswordsMatch(password, confirmPassword);
  const canSubmit = isValidPassword(password) && passwordsMatch && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (isLoading) {
    return (
      <Screen width="narrow">
        <Stack.Screen options={{ title: "Yeni Şifre" }} />
        <State loading title="Yükleniyor…" />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen width="narrow">
        <Stack.Screen options={{ title: "Yeni Şifre" }} />
        <State title="Bağlantının süresi dolmuş veya geçersiz. Yeniden şifre sıfırlama isteği gönderin." />
        <Button
          title="Şifremi unuttum"
          onPress={() => router.replace("/forgot-password")}
        />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen width="narrow">
        <Stack.Screen options={{ title: "Yeni Şifre" }} />
        <Brand />
        <Text style={ui.title}>Şifreniz güncellendi</Text>
        <Text style={ui.body}>Artık yeni şifrenizle giriş yapabilirsiniz.</Text>
        <Button title="Devam et" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  return (
    <Screen width="narrow">
      <Stack.Screen options={{ title: "Yeni Şifre" }} />
      <Brand />
      <Text style={ui.title}>Yeni şifre belirleyin</Text>
      <Text style={ui.body}>Devam etmek için yeni bir şifre girin.</Text>

      <TextInput
        accessibilityLabel="Yeni şifre"
        editable={!submitting}
        style={ui.input}
        placeholder="Yeni şifre (en az 6 karakter)"
        placeholderTextColor="#576872"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        accessibilityLabel="Yeni şifre (tekrar)"
        editable={!submitting}
        style={ui.input}
        placeholder="Yeni şifre (tekrar)"
        placeholderTextColor="#576872"
        secureTextEntry
        autoComplete="password-new"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {confirmPassword.length > 0 && !passwordsMatch && (
        <State title="Şifreler eşleşmiyor." />
      )}

      {!!error && <State title={error} />}

      <Button
        title={submitting ? "Kaydediliyor…" : "Şifreyi Güncelle"}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
      />
    </Screen>
  );
}
