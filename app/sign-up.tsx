import React, { useState } from "react";
import { Text, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Brand, Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { ui } from "@/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setInfo("");
    const result = await signUp(email, password, fullName);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setInfo("Hesabınız oluşturuldu. E-postanızı kontrol edip onaylayın, ardından giriş yapın.");
      return;
    }
    router.replace("/");
  }

  return (
    <Screen width="narrow">
      <Stack.Screen options={{ title: "Kayıt Ol" }} />
      <Brand />
      <Text style={ui.title}>Hesap oluşturun</Text>
      <Text style={ui.body}>
        Talep oluşturmak ve takip etmek için birkaç saniyede kayıt olun.
      </Text>

      <TextInput
        accessibilityLabel="Ad Soyad"
        editable={!submitting}
        style={ui.input}
        placeholder="Ad Soyad (isteğe bağlı)"
        placeholderTextColor="#576872"
        autoComplete="name"
        value={fullName}
        onChangeText={setFullName}
      />
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
        placeholder="Şifre (en az 6 karakter)"
        placeholderTextColor="#576872"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />

      {!!error && <State title={error} />}
      {!!info && <State title={info} />}

      <Button
        title={submitting ? "Kayıt oluyor…" : "Kayıt Ol"}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
      />

      <Button
        title="Zaten hesabınız var mı? Giriş yapın"
        secondary
        disabled={submitting}
        onPress={() => router.push("/sign-in")}
      />
    </Screen>
  );
}
