import { getTextKeywords, getTextMainIdea, getTextTopic } from "../utils/textPresentation.js";

export default function TextInsights({ text }) {
  const keywords = getTextKeywords(text);

  return (
    <section className="mt-10 border-y border-slate-200 py-6 dark:border-slate-800" aria-label="Metin bilgileri">
      <div className="grid gap-6 md:grid-cols-3 md:gap-0">
        <div className="md:border-r md:border-slate-200 md:pr-6 dark:md:border-slate-800">
          <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">Anahtar Kelimeler</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span key={keyword} className="rounded-md bg-slate-100 px-2 py-1 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 pt-6 md:border-r md:border-t-0 md:px-6 md:pt-0 dark:border-slate-800 dark:md:border-slate-800">
          <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">Ana Fikir</p>
          <p className="mt-3 leading-7 text-slate-800 dark:text-slate-100">{getTextMainIdea(text)}</p>
        </div>
        <div className="border-t border-slate-200 pt-6 md:border-t-0 md:pl-6 md:pt-0 dark:border-slate-800">
          <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">Konu</p>
          <p className="mt-3 leading-7 text-slate-800 dark:text-slate-100">{getTextTopic(text)}</p>
        </div>
      </div>
    </section>
  );
}
