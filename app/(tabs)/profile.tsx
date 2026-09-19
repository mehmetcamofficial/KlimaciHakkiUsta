import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { RequireAuth } from "@/components/auth-guard";
import { Brand, Button, Screen, State } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/rbac";
import { ui } from "@/theme";

function AuthenticatedProfile() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  return (
    <Screen>
      <Brand />
      <Text style={ui.title}>Profil</Text>
      <View style={ui.card}>
        <Text style={ui.heading}>{profile?.fullName || "İsim eklenmedi"}</Text>
        <Text style={ui.body}>{user?.email}</Text>
        {profile?.phone && <Text style={ui.body}>{profile.phone}</Text>}
        <Text style={ui.caption}>
          Rol: {profile ? roleLabel(profile.role) : "-"}
        </Text>
      </View>

      <Button
        title="Taleplerimi gör"
        onPress={() => router.push("/(tabs)/service")}
      />

      <View style={ui.card}>
        <Text style={ui.heading}>Her ihtiyaç için bir başlangıç</Text>
        <Text style={ui.body}>
          Klima, temizlik, elektrik ve diğer hizmetleri ana sayfadan keşfedin.
        </Text>
        <Button
          title="Hizmetleri keşfet"
          secondary
          onPress={() => router.push("/")}
        />
      </View>

      <Button
        title={signingOut ? "Çıkış yapılıyor…" : "Çıkış Yap"}
        secondary
        loading={signingOut}
        disabled={signingOut}
        onPress={handleSignOut}
      />

      {!profile && <State title="Profil bilgisi yüklenemedi." />}
    </Screen>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <AuthenticatedProfile />
    </RequireAuth>
  );
}
