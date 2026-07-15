import { useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Brain, Clock3, Flame, RotateCcw, Target, X } from "lucide-react";
import { todayKey, lastNDays, countCurrentStreak } from "../utils/dateHelpers";
import { getReaderLevel } from "../utils/scoring";
import { getTodayStats } from "../utils/recommendations";
import { getWeekKey } from "../utils/weeklyProgram";

const messages = [
  "Bugün sadece bir metin bile seni ileri taşır.",
  "Okudukça kelime hazinen güçlenir.",
  "Anlamak, dikkatle okumakla başlar.",
  "Her gün küçük bir okuma, büyük bir gelişim demektir."
];

export default function Home({ state, texts, setView, onResetProgress }) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const today = todayKey();
  const profile = state.studentProfile;
  const todayStats = getTodayStats(state.readingHistory, today);
  const totalRead = state.readingHistory.length;
  const days = lastNDays(7);
  const weeklyItems = state.readingHistory.filter((item) => days.includes(item.date));
  const weeklyMinutes = weeklyItems.reduce((sum, item) => sum + (item.readingMinutes || 0), 0);
  const totalWords = state.readingHistory.reduce((sum, item) => sum + (item.wordCount || 0), 0);
  const totalMinutes = state.readingHistory.reduce((sum, item) => sum + (item.readingMinutes || 0), 0);
  const remaining = Math.max(0, (profile?.dailyGoal || 1) - todayStats.readCount);
  const message = messages[new Date().getDate() % messages.length];
  const streak = countCurrentStreak(state.readingHistory);
  const weeklyComprehensionCount = (state.comprehensionHistory || []).filter((item) => item.weekKey === getWeekKey()).length;
  const weeklyComprehensionDone = weeklyComprehensionCount >= 5;

  return (
    <main className="page-shell">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-cyan-700 to-emerald-700 p-6 text-white shadow-soft sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-100">Bugünün okuma planı</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Merhaba {profile?.name || "Okur"}, bugün anlamaya bir adım daha yaklaşalım.
          </h1>
          <p className="mt-3 max-w-2xl text-blue-50">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="white-button" onClick={() => setView("weekly")}>
              Haftalık Çalışmaya Başla
              <ArrowRight size={18} />
            </button>
            <button className="ghost-white-button" onClick={() => setView("library")}>Metin Kütüphanesi</button>
            <button className="ghost-white-button" onClick={() => setView("progress")}>İlerlememi Gör</button>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <p className="section-eyebrow">Günlük hedef</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{todayStats.readCount}/{profile?.dailyGoal || 1}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {remaining === 0 ? "Tebrikler! Bugünkü okuma hedefini tamamladın." : `Hedefe ulaşmak için ${remaining} metin daha oku.`}
            </p>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, (todayStats.readCount / (profile?.dailyGoal || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 border-y border-slate-200 py-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"><Brain size={24} /></span>
            <div>
              <p className="font-black text-slate-950 dark:text-white">Okuma-Anlama Gelişim Programı</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{weeklyComprehensionDone ? "Bu haftanın 5 metnini tamamladın." : `Bu haftaki ilerlemen: ${weeklyComprehensionCount}/5 metin.`}</p>
            </div>
          </div>
          <button className="secondary-button" onClick={() => setView("weekly")}>{weeklyComprehensionDone ? "Çalışmayı incele" : "Programa git"}<ArrowRight size={18} /></button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Target} label="Bugün okunan" value={todayStats.readCount} detail={`${texts.length} metinlik kütüphane`} />
        <StatCard icon={Clock3} label="Bugünkü süre" value={`${todayStats.readingMinutes} dk`} detail="Okumada geçirilen süre" />
        <StatCard icon={BookOpen} label="Okunan kelime" value={totalWords.toLocaleString("tr-TR")} detail="Toplam kelime" />
        <StatCard icon={Flame} label="Okuma serisi" value={`${streak} gün`} detail={`Bu hafta ${weeklyMinutes} dakika`} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Genel görünüm</h2>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
              onClick={() => setShowResetDialog(true)}
            >
              <RotateCcw size={17} />
              İlerlemeyi sıfırla
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MiniMetric label="Toplam okunan metin" value={totalRead} />
            <MiniMetric label="Toplam okuma süresi" value={`${totalMinutes} dk`} />
            <MiniMetric label="Okur seviyesi" value={getReaderLevel(state.points)} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Kazanılan rozetler</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {state.badges.length ? state.badges.join(", ") : "İlk rozeti almak için bir metin tamamla."}
          </p>
        </div>
      </section>

      {showResetDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="presentation" onMouseDown={() => setShowResetDialog(false)}>
          <section
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle size={22} />
              </span>
              <button className="icon-button" aria-label="Pencereyi kapat" onClick={() => setShowResetDialog(false)}>
                <X size={19} />
              </button>
            </div>
            <h2 id="reset-dialog-title" className="mt-4 text-xl font-black text-slate-950 dark:text-white">Öğrenci ilerlemesi sıfırlansın mı?</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Okunan metinler, haftalık çalışmalar, puanlar ve rozetler silinecek. Profil ve kaydedilen metin listeleri korunacak.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="secondary-button" onClick={() => setShowResetDialog(false)}>Vazgeç</button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 font-black text-white transition hover:bg-red-700"
                onClick={() => {
                  onResetProgress();
                  setShowResetDialog(false);
                }}
              >
                <RotateCcw size={18} />
                Sıfırla
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="card">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
