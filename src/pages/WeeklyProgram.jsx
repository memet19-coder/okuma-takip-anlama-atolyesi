import { ArrowRight, Check, CheckCircle2, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import TextInsights from "../components/TextInsights.jsx";
import { comprehensionProgram } from "../data/comprehensionProgram.js";
import { splitTextIntoParagraphs } from "../utils/textPresentation.js";
import { getProgramIndex, getWeekKey } from "../utils/weeklyProgram.js";

const WEEKLY_TEXT_COUNT = 5;

export default function WeeklyProgram({ texts, state, onComplete }) {
  const weekKey = getWeekKey();
  const textIds = new Set(texts.map((text) => text.id));
  const availableProgram = comprehensionProgram.filter((assignment) => textIds.has(assignment.textId));
  const startIndex = (getProgramIndex(availableProgram.length) * WEEKLY_TEXT_COUNT) % availableProgram.length;
  const history = state.comprehensionHistory || [];
  const assignments = Array.from({ length: WEEKLY_TEXT_COUNT }, (_, index) => (
    availableProgram[(startIndex + index) % availableProgram.length]
  ));
  const legacyEntry = history.find((item) => item.weekKey === weekKey && !assignments.some((assignment) => assignment.textId === item.textId));
  const legacyAssignment = legacyEntry && availableProgram.find((item) => item.textId === legacyEntry.textId);
  if (legacyAssignment) assignments[0] = legacyAssignment;
  const savedForWeek = assignments.map((assignment) => history.find((item) => (
    item.weekKey === weekKey && item.textId === assignment.textId
  )));
  const initialIndex = Math.max(0, savedForWeek.findIndex((item) => !item));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const completedCount = savedForWeek.filter(Boolean).length;
  const assignment = assignments[activeIndex];
  const text = texts.find((item) => item.id === assignment.textId);

  if (!text) return null;

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-eyebrow">Okuma-Anlama Gelişim Programı</p>
            <h1 className="page-title">Bu haftanın 5 metni</h1>
            <p className="page-subtitle">Her metni dikkatle oku, cevaplarını yaz ve örnek cevaplarla karşılaştır.</p>
          </div>
          <span className={`status-pill ${completedCount === WEEKLY_TEXT_COUNT ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100"}`}>
            {completedCount}/{WEEKLY_TEXT_COUNT} tamamlandı
          </span>
        </div>

        <div className="mb-7 grid grid-cols-5 gap-2" aria-label="Haftalık metinler">
          {assignments.map((item, index) => {
            const done = Boolean(savedForWeek[index]);
            return (
              <button
                key={item.textId}
                className={`min-h-12 rounded-lg border text-sm font-black transition ${
                  activeIndex === index
                    ? "border-blue-600 bg-blue-600 text-white"
                    : done
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}. metin${done ? ", tamamlandı" : ""}`}
              >
                {done ? <CheckCircle2 className="mx-auto" size={19} /> : index + 1}
              </button>
            );
          })}
        </div>

        <Assignment
          key={assignment.textId}
          assignment={assignment}
          text={text}
          saved={savedForWeek[activeIndex]}
          number={activeIndex + 1}
          isLast={activeIndex === WEEKLY_TEXT_COUNT - 1}
          onComplete={(result) => onComplete(result, text)}
          onNext={() => setActiveIndex((index) => Math.min(WEEKLY_TEXT_COUNT - 1, index + 1))}
          weekKey={weekKey}
        />
      </div>
    </main>
  );
}

function Assignment({ assignment, text, saved, number, isLast, onComplete, onNext, weekKey }) {
  const [answers, setAnswers] = useState(() => saved?.answers || assignment.questions.map(() => ""));
  const [revealed, setRevealed] = useState(Boolean(saved));
  const [ratings, setRatings] = useState(() => saved?.ratings || assignment.questions.map(() => ""));
  const [completed, setCompleted] = useState(Boolean(saved));
  const allAnswered = useMemo(() => answers.every((answer) => answer.trim().length >= 3), [answers]);
  const allRated = ratings.every(Boolean);
  const paragraphs = useMemo(() => splitTextIntoParagraphs(text.content), [text.content]);

  function updateAnswer(index, value) {
    setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer));
  }

  function updateRating(index, value) {
    setRatings((current) => current.map((rating, ratingIndex) => ratingIndex === index ? value : rating));
  }

  function finish() {
    onComplete({
      assignmentId: `${weekKey}-${text.id}`,
      weekKey,
      textId: text.id,
      title: text.title,
      date: new Date().toISOString().slice(0, 10),
      answers,
      ratings,
      questionTypes: assignment.questions.map((question) => question.type)
    });
    setCompleted(true);
  }

  return (
    <>
      <article className="border-y border-slate-200 py-7 dark:border-slate-800">
        <div className="mb-5 flex flex-wrap gap-2">
          <span className="status-pill bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100">{number}. metin</span>
          <span className="status-pill bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{text.type}</span>
          <span className="status-pill bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{text.wordCount} kelime</span>
        </div>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Haftanın Metni</h2>
        <div className="mt-6 space-y-5 text-lg leading-9 text-slate-800 dark:text-slate-100">
          {paragraphs.map((paragraph, index) => (
            <p key={`${text.id}-weekly-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
        <TextInsights text={text} />
      </article>

      <section className="mt-8 space-y-6">
        {assignment.questions.map((question, index) => (
          <article key={`${question.type}-${index}`} className="card">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-950 dark:text-white">{question.prompt}</p>
                <label className="mt-4 block">
                  <span className="field-label">Senin cevabın</span>
                  <textarea
                    className="input min-h-28 resize-y"
                    value={answers[index]}
                    disabled={revealed}
                    onChange={(event) => updateAnswer(index, event.target.value)}
                    placeholder="Cevabını kendi cümlelerinle yaz."
                  />
                </label>

                {revealed && (
                  <div className="mt-4 border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/40">
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">Örnek cevap</p>
                    <p className="mt-1 leading-7 text-slate-800 dark:text-slate-100">{question.answer}</p>
                    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Cevabını değerlendir">
                      <button
                        className={`secondary-button ${ratings[index] === "close" ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" : ""}`}
                        onClick={() => updateRating(index, "close")}
                      >
                        <Check size={18} /> Cevabım yakın
                      </button>
                      <button
                        className={`secondary-button ${ratings[index] === "improve" ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" : ""}`}
                        onClick={() => updateRating(index, "improve")}
                      >
                        <RotateCcw size={18} /> Geliştirmeliyim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
        {!revealed && (
          <button className="primary-button w-full" disabled={!allAnswered} onClick={() => setRevealed(true)}>
            <Eye size={20} /> Cevapları göster
          </button>
        )}
        {revealed && !completed && (
          <button className="primary-button w-full" disabled={!allRated} onClick={finish}>
            <CheckCircle2 size={20} /> Metni tamamla
          </button>
        )}
        {completed && !isLast && (
          <button className="primary-button w-full" onClick={onNext}>
            Sıradaki metne geç <ArrowRight size={20} />
          </button>
        )}
        {completed && isLast && (
          <div className="flex items-center justify-center gap-2 bg-emerald-100 p-4 font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            <CheckCircle2 size={20} /> Bu metin tamamlandı
          </div>
        )}
        {!revealed && !allAnswered && <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">Örnek cevapları görmek için bütün soruları yanıtla.</p>}
        {revealed && !allRated && !completed && <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">Tamamlamadan önce her cevabını değerlendir.</p>}
      </div>
    </>
  );
}
