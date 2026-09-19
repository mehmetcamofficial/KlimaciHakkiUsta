from pathlib import Path

admin = Path("app/(tabs)/admin.tsx")
text = admin.read_text(encoding="utf-8")

old_block = """            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareTechnicianLocation(item.id)}
            >
              <Text style={styles.actionButtonText}>🚐 Usta Konumunu Bir Kez Paylaş</Text>
            </TouchableOpacity>

            {!isWatching ? (
              <TouchableOpacity
                style={styles.liveButton}
                onPress={() => startLiveTracking(item.id)}
              >
                <Text style={styles.liveButtonText}>🟢 Canlı Konum Takibini Başlat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopLiveTracking}
              >
                <Text style={styles.liveButtonText}>🔴 Canlı Konum Takibini Durdur</Text>
              </TouchableOpacity>
            )}"""

new_block = """            {item.status === 'Servis tamamlandı' ? (
              <View style={styles.closedBox}>
                <Text style={styles.closedTitle}>✅ Servis tamamlandı</Text>
                <Text style={styles.closedText}>Bu talep kapatıldı. Canlı konum takibi devre dışı.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareTechnicianLocation(item.id)}
                >
                  <Text style={styles.actionButtonText}>🚐 Usta Konumunu Bir Kez Paylaş</Text>
                </TouchableOpacity>

                {!isWatching ? (
                  <TouchableOpacity
                    style={styles.liveButton}
                    onPress={() => startLiveTracking(item.id)}
                  >
                    <Text style={styles.liveButtonText}>🟢 Canlı Konum Takibini Başlat</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopLiveTracking}
                  >
                    <Text style={styles.liveButtonText}>🔴 Canlı Konum Takibini Durdur</Text>
                  </TouchableOpacity>
                )}
              </>
            )}"""

if old_block not in text:
    print("Canlı takip buton bloğu bulunamadı. admin.tsx farklı olabilir.")
else:
    text = text.replace(old_block, new_block)

style_marker = """  mapBox: { backgroundColor: '#F1F5F9', borderRadius: 18, padding: 16, marginTop: 16 },"""

style_add = """  closedBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  closedTitle: {
    color: '#14532D',
    fontSize: 18,
    fontWeight: '800',
  },
  closedText: {
    color: '#166534',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '700',
  },
  mapBox: { backgroundColor: '#F1F5F9', borderRadius: 18, padding: 16, marginTop: 16 },"""

if "closedBox:" not in text:
    text = text.replace(style_marker, style_add)

admin.write_text(text, encoding="utf-8")
print("Admin panelde tamamlanan servisler için canlı takip butonları gizlendi.")
