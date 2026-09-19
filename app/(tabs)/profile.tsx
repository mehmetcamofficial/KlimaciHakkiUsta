import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Brand, Button, Screen } from "@/components/ui/marketplace";
import { ui } from "@/theme";
export default function ProfileScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Brand />
      <Text style={ui.title}>Profil</Text>
      <View style={ui.card}>
        <Text style={ui.heading}>Misafir kullanıcı</Text>
        <Text style={ui.body}>
          Hesap ve giriş özellikleri henüz hazır değil. Talepler şu anda kişisel
          bir hesaba bağlı değildir.
        </Text>
      </View>
      <Button
        title="Talep geçmişini gör"
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
    </Screen>
  );
}
