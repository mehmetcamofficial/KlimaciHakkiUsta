import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";
import { Screen, ServiceCard, State } from "@/components/ui/marketplace";
import { useCatalog } from "@/hooks/use-catalog";
import { ui } from "@/theme";
export default function CategoryScreen() {
  const { categorySlug } = useLocalSearchParams<{ categorySlug: string }>();
  const router = useRouter();
  const { catalog, loading, error, retry } = useCatalog();
  const category = catalog?.categories.find(
    (item) => item.slug === categorySlug,
  );
  const types =
    catalog?.serviceTypes.filter((item) => item.categoryId === category?.id) ??
    [];
  return (
    <>
      <Stack.Screen options={{ title: category?.name ?? "Hizmetler" }} />
      <Screen insetTop={false} width="medium">
        {loading ? (
          <State loading title="Hizmetler yükleniyor…" />
        ) : error ? (
          <State title="Hizmetler şu anda yüklenemiyor." retry={retry} />
        ) : !category ? (
          <State title="Kategori bulunamadı." />
        ) : (
          <>
            <Text style={ui.title}>Nasıl yardımcı olabiliriz?</Text>
            <Text style={ui.body}>{category.description}</Text>
            {!types.length && (
              <State title="Bu kategoride henüz hizmet bulunmuyor." />
            )}
            {types.map((type) => (
              <ServiceCard
                key={type.id}
                title={type.name}
                description={type.description}
                icon={category.iconKey}
                onPress={() =>
                  router.push({
                    pathname: "/request/new",
                    params: { category: category.slug, type: type.slug },
                  })
                }
              />
            ))}
          </>
        )}
      </Screen>
    </>
  );
}
