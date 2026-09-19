from pathlib import Path

tracking = Path("app/(tabs)/tracking.tsx")
text = tracking.read_text(encoding="utf-8")

text = text.replace(
"Mesafe: {distanceKm.toFixed(1)} km",
"Mesafe: {distanceKm < 0.1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}"
)

tracking.write_text(text, encoding="utf-8")
print("Mesafe etiketi metre/km formatına düzeltildi.")
