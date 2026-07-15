import { Printer } from "lucide-react";
import BadgeCard from "../components/BadgeCard.jsx";
import ProgressChart from "../components/ProgressChart.jsx";
import { countCurrentStreak, lastNDays } from "../utils/dateHelpers";
import { getReaderLevel } from "../utils/scoring";
import { getWeekKey } from "../utils/weeklyProgram";

const allBadges = ["İlk Metnim", "5 Günlük Okur", "10 Metin Tamamlandı", "Düzenli Okur", "Metin Kaşifi", "25 Bin Kelime", "Uzun Metin Okuru", "Haftanın Okuru"];

export default function Progress({ state }) {
  const history = state.readingHistory || [];
  const days = lastNDays(7);
  const weeklyRead = days.map((day) => ({
    label: day.slice(5),
    value: history.filter((item) => item.date === day).length
  }));
  const weeklyMinutes = days.map((day) => ({
    label: day.slice(5),
    value: history.filter((item) => item.date === day).reduce((sum, item) => sum + (item.readingMinutes || 0), 0)
  }));
  const typeCounts = groupCounts(history, "type");
  const lengthCounts = [
    { label: "Kısa", value: history.filter((item) => (item.wordCount || 0) < 120).length },
    { label: "Orta", value: history.filter((item) => (item.wordCount || 0) >= 120 && (item.wordCount || 0) < 300).length },
    { label: "Uzun", value: history.filter((item) => (item.wordCount || 0) >= 300).length }
  ];
  const totalWords = history.reduce((sum, item) => sum + (item.wordCount || 0), 0);
  const totalMinutes = history.reduce((sum, item) => sum + (item.readingMinutes || 0), 0);
  const favoriteType = [...typeCounts].sort((a, b) => b.value - a.value)[0]?.label || "Henüz yok";
  const averageWords = history.length ? Math.round(totalWords / history.length) : 0;
  const comprehension = state.comprehensionHistory || [];
  const allRatings = comprehension.flatMap((item) => item.ratings || []);
  const closeAnswers = allRatings.filter((rating) => rating === "close").length;
  const closeRate = allRatings.length ? Math.round((closeAnswers / allRatings.length) * 100) : 0;
  const currentWeekCount = comprehension.filter((item) => item.weekKey === getWeekKey()).length;
  const weekCounts = comprehension.reduce((counts, item) => counts.set(item.weekKey, (counts.get(item.weekKey) || 0) + 1), new Map());
  const completedWeeks = [...weekCounts.values()].filter((count) => count >= 5).length;

  return (
    <main className="page-shell">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-eyebrow">İlerleme</p>
          <h1 className="page-title">Okuma gelişimin</h1>
          <p className="page-subtitle">{countCurrentStreak(history)} günlük okuma serisi · {getReaderLevel(state.points)}</p>
        </div>
        <button className="secondary-button" onClick={() => window.print()}>
          <Printer size={18} />
          Raporu Yazdır
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Okuduğu metin sayısı" value={history.length} />
        <Metric label="Okuduğu kelime" value={totalWords.toLocaleString("tr-TR")} />
        <Metric label="Okuma süresi" value={`${totalMinutes} dk`} />
        <Metric label="Puan" value={state.points} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Bu haftaki anlama metni" value={`${Math.min(currentWeekCount, 5)}/5`} />
        <Metric label="Tamamlanan program haftası" value={completedWeeks} />
        <Metric label="Tamamlanan anlama metni" value={comprehension.length} />
        <Metric label="Karşılaştırılan cevap" value={allRatings.length} />
      </section>

      <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Cevabım yakın oranı: %{closeRate}</p>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProgressChart title="Son 7 gün okunan metin" data={weeklyRead} />
        <ProgressChart title="Son 7 gün okuma süresi" data={weeklyMinutes} valueSuffix=" dk" />
        <ProgressChart title="Okunan metin türleri" data={typeCounts.length ? typeCounts : [{ label: "Veri yok", value: 0 }]} />
        <ProgressChart title="Metin uzunlukları" data={lengthCounts} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Okuma özeti</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Summary label="En çok okunan tür" value={favoriteType} />
            <Summary label="Metin başına ortalama" value={`${averageWords} kelime`} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Rozetler</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {allBadges.map((badge) => <BadgeCard key={badge} badge={badge} locked={!state.badges.includes(badge)} />)}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return <article className="card"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{value}</p></article>;
}

function Summary({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p></div>;
}

function groupCounts(history, field) {
  const map = new Map();
  history.forEach((item) => map.set(item[field] || "Diğer", (map.get(item[field] || "Diğer") || 0) + 1));
  return Array.from(map, ([label, value]) => ({ label, value }));
}
