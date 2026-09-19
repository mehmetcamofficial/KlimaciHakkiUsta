from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

# Alert importu yoksa ekle
text = text.replace(
    "import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';",
    "import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';"
)

old_block = """          {hasCustomerLocation && hasTechnicianLocation ? (
            <TouchableOpacity style={styles.routeButton} onPress={openRouteMap}>
              <Text style={styles.routeButtonText}>🗺️ Yol Tarifi Aç</Text>
            </TouchableOpacity>
          ) : null}"""

new_block = """          {hasCustomerLocation && hasTechnicianLocation && !isCompleted ? (
            <TouchableOpacity style={styles.routeButton} onPress={openRouteMap}>
              <Text style={styles.routeButtonText}>🗺️ Yol Tarifi Aç</Text>
            </TouchableOpacity>
          ) : null}

          {isCompleted ? (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                Alert.alert(
                  'Servis Değerlendirme',
                  'Bir sonraki adımda buraya 1-5 yıldız puanlama ekranı ekleyeceğiz.'
                )
              }
            >
              <Text style={styles.reviewButtonText}>⭐ Servisi Değerlendir</Text>
            </TouchableOpacity>
          ) : null}"""

if old_block not in text:
    print("Yol Tarifi bloğu bulunamadı. Dosya yapısı değişmiş olabilir.")
else:
    text = text.replace(old_block, new_block)

style_marker = """  routeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
  },"""

style_add = """  routeButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
  },

  reviewButton: {
    marginTop: 14,
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 16,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
  },"""

text = text.replace(style_marker, style_add)

tracking.write_text(text, encoding="utf-8")
print("Servis tamamlanınca Yol Tarifi gizlendi, Servisi Değerlendir butonu eklendi.")
