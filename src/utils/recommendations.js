function targetDifficulties(profile) {
  if (profile?.readingLevel === "Zor") return ["Zor", "Orta"];
  if (profile?.readingLevel === "Kolay") return ["Kolay", "Orta"];
  return ["Orta", "Kolay", "Zor"];
}

export function recommendText(texts, state) {
  const profile = state.studentProfile;
  const readIds = new Set(state.readingHistory.map((item) => item.textId));
  const unread = texts.filter((text) => !readIds.has(text.id));
  const pool = unread.length ? unread : texts;
  const recentTypes = state.readingHistory.slice(-3).map((item) => item.type);
  const repeatedType = recentTypes.length === 3 && recentTypes.every((type) => type === recentTypes[0])
    ? recentTypes[0]
    : null;
  const difficulties = targetDifficulties(profile);

  const scored = pool.map((text) => {
    let score = 0;
    if (profile?.grade && text.gradeLevel.includes(Number(profile.grade))) score += 5;
    if (profile?.preferredTypes?.includes(text.type)) score += 3;
    if (difficulties.includes(text.difficulty)) score += 4;
    if (repeatedType && text.type !== repeatedType) score += 3;
    if (!readIds.has(text.id)) score += 2;
    return { text, score };
  });

  return scored.sort((a, b) => b.score - a.score || a.text.estimatedReadingTime - b.text.estimatedReadingTime)[0]?.text;
}

export function getTodayStats(history, today) {
  const items = history.filter((item) => item.date === today);

  return {
    readCount: items.length,
    readingMinutes: items.reduce((sum, item) => sum + (item.readingMinutes || 0), 0),
    wordCount: items.reduce((sum, item) => sum + (item.wordCount || 0), 0)
  };
}
