from pathlib import Path

admin = Path("app/(tabs)/admin.tsx")
text = admin.read_text(encoding="utf-8")

old = """            <View style={styles.mapBox}>"""

new = """            {item.rating ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewTitle}>Müşteri Değerlendirmesi</Text>
                <Text style={styles.reviewStars}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </Text>
                {item.review_comment ? (
                  <Text style={styles.reviewComment}>{item.review_comment}</Text>
                ) : (
                  <Text style={styles.reviewComment}>Yorum yazılmadı.</Text>
                )}
              </View>
            ) : null}

            <View style={styles.mapBox}>"""

if old not in text:
    print("mapBox bloğu bulunamadı. Dosya yapısı değişmiş olabilir.")
else:
    text = text.replace(old, new)

style_marker = """  mapBox: { backgroundColor: '#F1F5F9', borderRadius: 18, padding: 16, marginTop: 16 },"""

style_add = """  reviewBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  reviewTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  reviewComment: {
    color: '#78350F',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '700',
  },
  mapBox: { backgroundColor: '#F1F5F9', borderRadius: 18, padding: 16, marginTop: 16 },"""

if style_marker not in text:
    print("mapBox style satırı bulunamadı. Style eklenememiş olabilir.")
else:
    text = text.replace(style_marker, style_add)

admin.write_text(text, encoding="utf-8")
print("Admin paneline müşteri değerlendirmesi görünümü eklendi.")
