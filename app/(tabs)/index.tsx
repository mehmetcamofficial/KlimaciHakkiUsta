import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Klimacı Hakkı Usta</Text>

        <Text style={styles.subtitle}>
          Klima arızası, bakım, montaj ve acil servis için hızlı çözüm.
        </Text>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Hızlı Servis Çağır</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bugün ne yapmak istiyorsun?</Text>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionTitle}>Klima Arızası Bildir</Text>
            <Text style={styles.optionText}>
              Soğutmuyor, su akıtıyor, ses yapıyor veya hata kodu veriyor.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionTitle}>Bakım Randevusu Al</Text>
            <Text style={styles.optionText}>
              Yaz/kış sezonu öncesi klima temizliği ve kontrolü.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionTitle}>Montaj Talebi Oluştur</Text>
            <Text style={styles.optionText}>
              Yeni klima kurulumu veya klima yer değişimi.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.darkCard}>
          <Text style={styles.darkCardTitle}>Acil Servis</Text>
          <Text style={styles.darkCardText}>
            Yakındaki uygun ustaya talep gönderilir. Usta kabul edince takip ekranı açılır.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 26,
    color: '#64748B',
  },
  primaryButton: {
    marginTop: 32,
    backgroundColor: '#06B6D4',
    padding: 24,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  option: {
    backgroundColor: '#F1F5F9',
    padding: 18,
    borderRadius: 18,
    marginTop: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  optionText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
  },
  darkCard: {
    marginTop: 24,
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 24,
  },
  darkCardTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  darkCardText: {
    marginTop: 8,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
});