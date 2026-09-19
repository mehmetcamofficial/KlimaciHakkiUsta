from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

old = """          {distanceKm ? (
            <View style={styles.distanceBox}>
              <Text style={styles.distanceTitle}>🚐 Usta size doğru geliyor</Text>
              <Text style={styles.distanceText}>Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</Text>
              <Text style={styles.distanceText}>Tahmini varış: {etaMinutes} dk</Text>
            </View>
          ) : null}"""

new = """          {distanceKm ? (
            <>
              <View style={styles.miniMap}>
                <View style={styles.mapLine} />

                <View style={[styles.pinWrap, styles.customerPin]}>
                  <Text style={styles.pinIcon}>📍</Text>
                  <Text style={styles.pinLabel}>Müşteri</Text>
                </View>

                <View style={[styles.pinWrap, styles.techPin]}>
                  <Text style={styles.pinIcon}>🚐</Text>
                  <Text style={styles.pinLabel}>Usta</Text>
                </View>
              </View>

              <View style={styles.distanceBox}>
                <Text style={styles.distanceTitle}>🚐 Usta size doğru geliyor</Text>
                <Text style={styles.distanceText}>Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</Text>
                <Text style={styles.distanceText}>Tahmini varış: {etaMinutes} dk</Text>
              </View>
            </>
          ) : null}"""

if old not in text:
    print("Beklenen distanceBox bloğu bulunamadı. tracking.tsx farklı olabilir.")
else:
    text = text.replace(old, new)

style_marker = """  distanceBox: { marginTop: 16, backgroundColor: '#E0F2FE', padding: 16, borderRadius: 18 },"""

mini_styles = """  miniMap: {
    height: 170,
    backgroundColor: '#E0F2FE',
    borderRadius: 22,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mapLine: {
    position: 'absolute',
    left: 55,
    right: 55,
    top: 84,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
  },
  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  customerPin: {
    left: 22,
    top: 54,
  },
  techPin: {
    right: 28,
    top: 54,
  },
  pinIcon: {
    fontSize: 34,
  },
  pinLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },"""

if "miniMap:" not in text:
    text = text.replace(style_marker, mini_styles + "\n" + style_marker)

tracking.write_text(text, encoding="utf-8")
print("Tracking ekranına mini canlı harita kartı eklendi.")
