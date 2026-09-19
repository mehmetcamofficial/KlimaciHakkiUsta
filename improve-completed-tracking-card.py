from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

# Status kontrolü ekle
old = """  const isVeryClose = distanceKm !== null && distanceKm < 0.2;"""

new = """  const isVeryClose = distanceKm !== null && distanceKm < 0.2;
  const isCompleted = status === 'Servis tamamlandı';"""

text = text.replace(old, new)

# Distance box başlığını ve metinlerini status'a göre değiştir
old_block = """              <View style={styles.distanceBox}>
                <Text style={styles.distanceTitle}>🚐 Usta size doğru geliyor</Text>
                <Text style={styles.distanceText}>
                  Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                </Text>
                <Text style={styles.distanceText}>Tahmini varış: {etaMinutes} dk</Text>
              </View>"""

new_block = """              <View style={[styles.distanceBox, isCompleted && styles.completedBox]}>
                <Text style={styles.distanceTitle}>
                  {isCompleted ? '✅ Servis tamamlandı' : '🚐 Usta size doğru geliyor'}
                </Text>

                {isCompleted ? (
                  <Text style={styles.distanceText}>
                    Usta adresinize ulaştı ve servis süreci tamamlandı.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.distanceText}>
                      Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                    </Text>
                    <Text style={styles.distanceText}>Tahmini varış: {etaMinutes} dk</Text>
                  </>
                )}
              </View>"""

text = text.replace(old_block, new_block)

# completedBox style ekle
style_marker = """  distanceBox: {
    marginTop: 16,
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 18,
  },"""

style_replacement = """  distanceBox: {
    marginTop: 16,
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 18,
  },

  completedBox: {
    backgroundColor: '#DCFCE7',
  },"""

text = text.replace(style_marker, style_replacement)

tracking.write_text(text, encoding="utf-8")
print("Servis tamamlandı durumunda takip kartı tamamlandı moduna geçirildi.")
