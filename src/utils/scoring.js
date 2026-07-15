import { countCurrentStreak } from "./dateHelpers";

export function calculateReadingPoints(result) {
  const lengthBonus = result.wordCount >= 500 ? 10 : result.wordCount >= 250 ? 5 : 0;
  return 10 + lengthBonus;
}

export function calculateBadges(state, nextHistory) {
  const badges = new Set(state.badges);
  const totalRead = nextHistory.length;
  const streak = countCurrentStreak(nextHistory);

  if (totalRead >= 1) badges.add("İlk Metnim");
  if (streak >= 5) badges.add("5 Günlük Okur");
  if (totalRead >= 10) badges.add("10 Metin Tamamlandı");
  if (totalRead >= 25) badges.add("Düzenli Okur");
  if (totalRead >= 50) badges.add("Metin Kaşifi");
  if (nextHistory.reduce((sum, item) => sum + (item.wordCount || 0), 0) >= 25000) badges.add("25 Bin Kelime");
  if (nextHistory.some((item) => (item.wordCount || 0) >= 500)) badges.add("Uzun Metin Okuru");
  if (streak >= 7) badges.add("Haftanın Okuru");

  return Array.from(badges);
}

export function getReaderLevel(points) {
  if (points >= 450) return "Seviye 5: Kitap Kurdu";
  if (points >= 300) return "Seviye 4: Anlama Ustası";
  if (points >= 180) return "Seviye 3: Metin Kaşifi";
  if (points >= 80) return "Seviye 2: Dikkatli Okur";
  return "Seviye 1: Yeni Okur";
}
