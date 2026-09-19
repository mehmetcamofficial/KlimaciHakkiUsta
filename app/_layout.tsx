import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/lib/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ title: "Giriş Yap" }} />
          <Stack.Screen name="sign-up" options={{ title: "Kayıt Ol" }} />
          <Stack.Screen name="forgot-password" options={{ title: "Şifremi Unuttum" }} />
          <Stack.Screen name="reset-password" options={{ title: "Yeni Şifre" }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
