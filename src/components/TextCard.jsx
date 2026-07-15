import { Bookmark, CheckCircle2, Clock, Heart, Play, RotateCcw } from "lucide-react";

export default function TextCard({ text, isRead, isFavorite, isLater, onStart, onFavorite, onReadLater }) {
  return (
    <article
      className={`card flex h-full flex-col gap-4 transition ${
        isRead
          ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:ring-emerald-950"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${isRead ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"}`}>
            {text.type}
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{text.title}</h3>
        </div>
        <span
          className={`status-pill ${
            isRead
              ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {isRead ? "Okundu" : "Yeni"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1">
          <Clock size={15} /> {text.estimatedReadingTime} dk
        </span>
        <span>{text.wordCount} kelime</span>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">Konu: {text.topic}</p>

      {isRead && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
          <CheckCircle2 size={17} />
          Bu metin okundu
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        <button className="primary-button flex-1" onClick={() => onStart(text)}>
          {isRead ? <RotateCcw size={18} /> : <Play size={18} />}
          {isRead ? "Tekrar Oku" : "Okumaya Başla"}
        </button>
        <button className={`icon-button ${isFavorite ? "text-rose-600" : ""}`} onClick={() => onFavorite(text.id)} title="Favori">
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button className={`icon-button ${isLater ? "text-amber-600" : ""}`} onClick={() => onReadLater(text.id)} title="Sonra oku">
          <Bookmark size={18} fill={isLater ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
