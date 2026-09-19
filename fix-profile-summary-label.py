from pathlib import Path

profile = Path("app/(tabs)/profile.tsx")
text = profile.read_text(encoding="utf-8")

text = text.replace("Tamamlanan", "Biten")

profile.write_text(text, encoding="utf-8")
print("Profil özetindeki Tamamlanan etiketi Biten olarak düzeltildi.")
