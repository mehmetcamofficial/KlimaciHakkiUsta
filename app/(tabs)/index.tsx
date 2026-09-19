import React, { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Brand, Screen, ServiceCard, State } from "@/components/ui/marketplace";
import { useCatalog } from "@/hooks/use-catalog";
import { colors, radius, spacing, ui } from "@/theme";

const quickSlugs = [
  "su-kacagi",
  "elektrik-arizasi",
  "klima-bakimi",
  "kapi-acma",
];
export default function HomeScreen() {
  const router = useRouter();
  const { catalog, loading, error, retry } = useCatalog();
  const [search, setSearch] = useState("");
  const { width, fontScale } = useWindowDimensions();
  const query = search.trim().toLocaleLowerCase("tr");
  const types = catalog?.serviceTypes ?? [];
  const categories = (catalog?.categories ?? []).filter(
    (category) =>
      !query ||
      [
        category.name,
        ...types
          .filter((type) => type.categoryId === category.id)
          .map((type) => type.name),
      ].some((name) => name.toLocaleLowerCase("tr").includes(query)),
  );
  return (
    <Screen>
      <Brand />
      <View style={{ paddingVertical: spacing.lg, gap: spacing.md }}>
        <Text style={[ui.caption, { color: colors.accent, fontWeight: "700" }]}>
          EVİNİZ İÇİN, YANINIZDA
        </Text>
        <Text style={ui.title}>Bugün neye{"\n"}ihtiyacınız var?</Text>
        <Text style={ui.body}>
          Bakım, onarım ve günlük işler için hizmetinizi seçin.
        </Text>
      </View>
      <View style={[ui.input, ui.row]}>
        <Ionicons name="search" size={22} color={colors.muted} />
        <TextInput
          accessibilityLabel="Hizmet ara"
          placeholder="Hangi hizmete ihtiyacınız var?"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, minWidth: 0, fontSize: 16, color: colors.text }}
        />
      </View>
      <Text style={ui.heading}>Hizmetler</Text>
      {loading ? (
        <State loading title="Hizmetler yükleniyor…" />
      ) : error ? (
        <State title="Hizmetler şu anda yüklenemiyor." retry={retry} />
      ) : (
        <>
          {catalog?.source === "local" && (
            <Text style={ui.caption}>
              Başlangıç hizmet kataloğu gösteriliyor.
            </Text>
          )}
          {!categories.length && (
            <State
              title={
                query
                  ? "Aramanızla eşleşen hizmet bulunamadı."
                  : "Henüz hizmet bulunmuyor."
              }
              retry={query ? undefined : retry}
            />
          )}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={category.name}
                onPress={() =>
                  router.push({
                    pathname: "/services/[categorySlug]",
                    params: { categorySlug: category.slug },
                  })
                }
                style={({ pressed }) => [
                  ui.card,
                  {
                    width: width < 350 || fontScale > 1.3 ? "100%" : "47.5%",
                    minHeight: 132,
                    opacity: pressed ? 0.6 : 1,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View
                  style={{
                    backgroundColor: colors.subtle,
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    alignSelf: "flex-start",
                  }}
                >
                  <Ionicons
                    name={
                      (category.iconKey in Ionicons.glyphMap
                        ? category.iconKey
                        : "grid-outline") as React.ComponentProps<
                        typeof Ionicons
                      >["name"]
                    }
                    size={25}
                    color={colors.accent}
                  />
                </View>
                <Text style={[ui.heading, { fontSize: 16, lineHeight: 23 }]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
          {!query && (
            <>
              <Text style={ui.heading}>Sık Kullanılan Hizmetler</Text>
              {types
                .filter((type) => quickSlugs.includes(type.slug))
                .map((type) => (
                  <ServiceCard
                    key={type.id}
                    title={type.name}
                    icon={
                      catalog?.categories.find(
                        (category) => category.id === type.categoryId,
                      )?.iconKey
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/request/new",
                        params: {
                          category: type.categorySlug,
                          type: type.slug,
                        },
                      })
                    }
                  />
                ))}
            </>
          )}
        </>
      )}
      <View style={ui.card}>
        <Text style={ui.heading}>İhtiyacınızı anlatın, ilk adımı atın.</Text>
        <Text style={ui.body}>
          Hizmetinizi seçin, detayları ekleyin ve talebinizin durumunu takip
          edin.
        </Text>
      </View>
    </Screen>
  );
}
