from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

# distanceKm hesaplandıktan sonra progress hesapla
old = """  const etaMinutes = distanceKm !== null ? Math.max(1, Math.ceil((distanceKm / 30) * 60)) : null;"""

new = """  const etaMinutes = distanceKm !== null ? Math.max(1, Math.ceil((distanceKm / 30) * 60)) : null;

  const progress =
    distanceKm !== null
      ? distanceKm > 3
        ? 1
        : Math.max(0.05, Math.min(1, distanceKm / 3))
      : 1;"""

text = text.replace(old, new)

# Usta pinini dinamik hale getir
old_pin = """                <View style={[styles.pinWrap, styles.techPin]}>
                  <Text style={styles.pinIcon}>🚐</Text>
                  <Text style={styles.pinLabel}>Usta</Text>
                </View>"""

new_pin = """                <View
                  style={[
                    styles.pinWrap,
                    {
                      top: 54,
                      left: `${20 + progress * 60}%`,
                    },
                  ]}
                >
                  <Text style={styles.pinIcon}>🚐</Text>
                  <Text style={styles.pinLabel}>Usta</Text>
                </View>"""

text = text.replace(old_pin, new_pin)

# Eski techPin style artık kullanılmıyor ama kalsın sorun değil
tracking.write_text(text, encoding="utf-8")

print("Mini haritada usta pini mesafeye göre hareketli hale getirildi.")
