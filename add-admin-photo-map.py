from pathlib import Path

admin = Path("app/(tabs)/admin.tsx")
text = admin.read_text(encoding="utf-8")

text = text.replace(
    "import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';",
    "import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';"
)

old = """          <Text style={styles.status}>Durum: {item.status}</Text>

          <View style={styles.buttonGrid}>"""

new = """          <Text style={styles.status}>Durum: {item.status}</Text>

          {item.photo_url ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(item.photo_url)}
            >
              <Text style={styles.actionButtonText}>📷 Fotoğrafı Aç</Text>
            </TouchableOpacity>
          ) : null}

          {item.latitude && item.longitude ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`)
              }
            >
              <Text style={styles.actionButtonText}>📍 Haritada Aç</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.buttonGrid}>"""

text = text.replace(old, new)

text = text.replace(
    "buttonGrid: { marginTop: 16, gap: 10 },",
    "buttonGrid: { marginTop: 16, gap: 10 },\n  actionButton: { backgroundColor: '#0F172A', padding: 14, borderRadius: 16, marginTop: 12 },\n  actionButtonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },"
)

admin.write_text(text, encoding="utf-8")
print("Admin paneline Fotoğrafı Aç ve Haritada Aç butonları eklendi.")
