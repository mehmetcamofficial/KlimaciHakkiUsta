from pathlib import Path

profile = Path("app/(tabs)/profile.tsx")
text = profile.read_text(encoding="utf-8")

# router importu ekle
if "useRouter" not in text:
    text = text.replace(
        "import React, { useEffect, useState } from 'react';",
        "import React, { useEffect, useState } from 'react';\nimport { useRouter } from 'expo-router';"
    )

# component içine router ekle
if "const router = useRouter();" not in text:
    text = text.replace(
        "export default function ProfileScreen() {\n  const [requests, setRequests] = useState<any[]>([]);",
        "export default function ProfileScreen() {\n  const router = useRouter();\n  const [requests, setRequests] = useState<any[]>([]);"
    )

# actionRow içine aktif talep takip butonu ekle
old = """            <View style={styles.actionRow}>
              {hasPhoto ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => Linking.openURL(item.photo_url)}
                >
                  <Text style={styles.smallButtonText}>📷 Fotoğraf</Text>
                </TouchableOpacity>
              ) : null}

              {item.latitude && item.longitude ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`)
                  }
                >
                  <Text style={styles.smallButtonText}>📍 Konum</Text>
                </TouchableOpacity>
              ) : null}
            </View>"""

new = """            <View style={styles.actionRow}>
              {!isCompleted ? (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => router.push('/(tabs)/tracking')}
                >
                  <Text style={styles.trackButtonText}>🚐 Takip Ekranına Git</Text>
                </TouchableOpacity>
              ) : null}

              {hasPhoto ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => Linking.openURL(item.photo_url)}
                >
                  <Text style={styles.smallButtonText}>📷 Fotoğraf</Text>
                </TouchableOpacity>
              ) : null}

              {item.latitude && item.longitude ? (
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() =>
                    Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`)
                  }
                >
                  <Text style={styles.smallButtonText}>📍 Konum</Text>
                </TouchableOpacity>
              ) : null}
            </View>"""

if old not in text:
    print("actionRow bloğu bulunamadı. profile.tsx dosyası beklenenden farklı olabilir.")
else:
    text = text.replace(old, new)

# style ekle
style_marker = """  smallButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },"""

style_add = """  trackButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  trackButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  smallButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },"""

if "trackButton:" not in text:
    text = text.replace(style_marker, style_add)

profile.write_text(text, encoding="utf-8")
print("Profil geçmişindeki aktif talepler için Takip Ekranına Git butonu eklendi.")
