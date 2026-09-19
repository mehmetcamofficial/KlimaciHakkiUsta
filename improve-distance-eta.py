from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

# ETA minimumunu 1 dakikaya düşür
text = text.replace(
    "const etaMinutes = distanceKm ? Math.max(3, Math.ceil((distanceKm / 30) * 60)) : null;",
    "const etaMinutes = distanceKm !== null ? Math.max(1, Math.ceil((distanceKm / 30) * 60)) : null;"
)

# 0.0 km yerine metre/km formatı
text = text.replace(
    "Mesafe: {distanceKm.toFixed(1)} km",
    "Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}"
)

# Eğer önceki script farklı format yazdıysa onu da yakala
text = text.replace(
    "Mesafe: {distanceKm < 0.1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}",
    "Mesafe: {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}"
)

tracking.write_text(text, encoding="utf-8")

print("Takip ekranında mesafe metre/km formatına ve ETA minimum 1 dakikaya ayarlandı.")
