export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function lastNDays(count, from = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(from);
    date.setDate(from.getDate() - (count - 1 - index));
    return todayKey(date);
  });
}

export function isSameDay(dateKey, compare = todayKey()) {
  return dateKey === compare;
}

export function countCurrentStreak(history) {
  const readDays = new Set(history.map((item) => item.date));
  let streak = 0;
  const cursor = new Date();

  while (readDays.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
