import { ArrowRight, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { recommendText } from "../utils/recommendations";

export default function DailyReading({ texts, state, onStart }) {
  const [offset, setOffset] = useState(0);
  const suggested = useMemo(() => {
    const first = recommendText(texts, state);
    if (!first) return null;
    const ordered = [first, ...texts.filter((text) => text.id !== first.id)];
    return ordered[offset % ordered.length];
  }, [texts, state, offset]);

  if (!suggested) {
    return (
      <main className="page-shell">
        <div className="card text-center">Henüz önerilecek metin yok.</div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="section-eyebrow">Günlük Okuma</p>
          <h1 className="page-title">Bugün için önerilen metin</h1>
          <p className="page-subtitle">Öneri; sınıf düzeyin, tercihlerin ve daha önce okuduğun metinlere göre seçildi.</p>
        </div>

        <article className="card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">{suggested.type}</span>
            <span className="status-pill bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{suggested.difficulty}</span>
            <span className="status-pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{suggested.estimatedReadingTime} dk</span>
          </div>
          <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{suggested.title}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Konu: {suggested.topic} · {suggested.wordCount} kelime</p>
          <p className="mt-4 text-slate-600 dark:text-slate-300">{suggested.content.slice(0, 220)}...</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="primary-button" onClick={() => onStart(suggested)}>
              Okumaya Başla
              <ArrowRight size={18} />
            </button>
            <button className="secondary-button" onClick={() => setOffset((value) => value + 1)}>
              <RefreshCw size={18} />
              Başka Metin Öner
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
