import { CheckCircle2, Minus, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TextInsights from "../components/TextInsights.jsx";
import { splitTextIntoParagraphs } from "../utils/textPresentation.js";

export default function ReadingPage({ text, onComplete, onBack, theme, toggleTheme, isRead }) {
  const [fontSize, setFontSize] = useState(20);
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function updateProgress() {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(documentHeight <= 0 ? 100 : Math.round((window.scrollY / documentHeight) * 100));
    }
    updateProgress();
    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const paragraphs = useMemo(() => text ? splitTextIntoParagraphs(text.content) : [], [text]);

  if (!text) return null;

  const minutes = Math.max(1, Math.round(seconds / 60));

  return (
    <main className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
      <div className="sticky top-[69px] z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button className="secondary-button" onClick={onBack}>Geri</button>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={() => setFontSize((value) => Math.max(16, value - 2))} title="Yazıyı küçült"><Minus size={18} /></button>
            <button className="icon-button" onClick={() => setFontSize((value) => Math.min(28, value + 2))} title="Yazıyı büyüt"><Plus size={18} /></button>
            <button className="icon-button" onClick={toggleTheme} title={theme === "dark" ? "Açık tema" : "Koyu tema"}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="status-pill bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">{text.type}</span>
          <span className="status-pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{text.estimatedReadingTime} dk</span>
          <span className="status-pill bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Süre: {minutes} dk</span>
        </div>
        <h1 className="text-4xl font-black text-slate-950 dark:text-white">{text.title}</h1>
        <div className="mt-8 space-y-6" style={{ fontSize: `${fontSize}px` }}>
          {paragraphs.map((paragraph, index) => (
            <p key={`${text.id}-paragraph-${index}`} className="leading-loose text-slate-800 dark:text-slate-100">{paragraph}</p>
          ))}
        </div>

        <TextInsights text={text} />

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button className="primary-button w-full justify-center" onClick={() => onComplete(minutes)}>
            <CheckCircle2 size={20} />
            {isRead ? "Tekrar okumayı bitirdim" : "Okudum, tamamla"}
          </button>
        </div>
      </article>
    </main>
  );
}
