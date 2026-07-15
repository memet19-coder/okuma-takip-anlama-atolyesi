import { useEffect, useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Header from "./components/Header.jsx";
import texts from "./data/texts.json";
import DailyReading from "./pages/DailyReading.jsx";
import Home from "./pages/Home.jsx";
import Library from "./pages/Library.jsx";
import Profile from "./pages/Profile.jsx";
import Progress from "./pages/Progress.jsx";
import ReadingPage from "./pages/ReadingPage.jsx";
import TeacherPanel from "./pages/TeacherPanel.jsx";
import WeeklyProgram from "./pages/WeeklyProgram.jsx";
import { todayKey } from "./utils/dateHelpers.js";
import { calculateBadges, calculateReadingPoints } from "./utils/scoring.js";
import { loadState, saveState } from "./utils/storage.js";
import { syncStudentProgress } from "./utils/supabase.js";

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState("home");
  const [activeText, setActiveText] = useState(null);

  useEffect(() => {
    saveState(state);
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state]);

  useEffect(() => {
    if (!state.studentProfile?.name?.trim()) return undefined;
    let cancelled = false;

    async function syncNow() {
      try {
        const result = await syncStudentProgress(state);
        const correction = result.correction;
        if (!correction || cancelled) return;
        setState((current) => {
          if ((current.cloudRevision || 0) >= correction.teacher_revision) return current;
          const readingHistory = Array.isArray(correction.reading_history) ? correction.reading_history : [];
          const comprehensionHistory = Array.isArray(correction.comprehension_history) ? correction.comprehension_history : [];
          return {
            ...current,
            cloudRevision: correction.teacher_revision,
            studentProfile: {
              ...current.studentProfile,
              name: correction.student_name,
              grade: correction.grade
            },
            readingHistory,
            comprehensionHistory,
            points: readingHistory.reduce((sum, item) => sum + calculateReadingPoints(item), 0) + comprehensionHistory.length * 30,
            badges: calculateBadges({ ...current, badges: [] }, readingHistory)
          };
        });
      } catch (error) {
        console.warn("Öğrenci ilerlemesi buluta aktarılamadı.", error.message);
      }
    }

    const timeout = window.setTimeout(syncNow, 700);
    const interval = window.setInterval(syncNow, 30000);
    window.addEventListener("focus", syncNow);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", syncNow);
    };
  }, [state]);

  function patchState(updater) {
    setState((current) => (typeof updater === "function" ? updater(current) : updater));
  }

  function saveProfile(profile) {
    patchState((current) => ({ ...current, studentProfile: profile }));
    setView("home");
  }

  function startText(text) {
    setActiveText(text);
    setView("reading");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeReading(minutes) {
    if (!activeText) return;
    patchState((current) => {
      const alreadyRead = current.readingHistory.some((item) => item.textId === activeText.id);
      if (alreadyRead) {
        return {
          ...current,
          readingHistory: current.readingHistory.map((item) => item.textId === activeText.id
            ? {
                ...item,
                readingMinutes: item.readingMinutes || minutes,
                wordCount: item.wordCount || activeText.wordCount,
                topic: item.topic || activeText.topic
              }
            : item)
        };
      }
      const result = {
        textId: activeText.id,
        title: activeText.title,
        type: activeText.type,
        topic: activeText.topic,
        difficulty: activeText.difficulty,
        date: todayKey(),
        readingMinutes: minutes,
        wordCount: activeText.wordCount
      };
      const nextHistory = [...current.readingHistory, result];
      return {
        ...current,
        readingHistory: nextHistory,
        points: current.points + calculateReadingPoints(result),
        badges: calculateBadges(current, nextHistory)
      };
    });
    setView("library");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeComprehension(result, text) {
    patchState((current) => {
      if ((current.comprehensionHistory || []).some((item) => (
        item.assignmentId === result.assignmentId ||
        (item.weekKey === result.weekKey && item.textId === result.textId)
      ))) return current;
      const alreadyRead = current.readingHistory.some((item) => item.textId === text.id);
      const readingResult = {
        textId: text.id,
        title: text.title,
        type: text.type,
        topic: text.topic,
        difficulty: text.difficulty,
        date: todayKey(),
        readingMinutes: text.estimatedReadingTime || 1,
        wordCount: text.wordCount
      };
      const nextHistory = alreadyRead ? current.readingHistory : [...current.readingHistory, readingResult];
      return {
        ...current,
        comprehensionHistory: [...(current.comprehensionHistory || []), result],
        readingHistory: nextHistory,
        points: current.points + 30 + (alreadyRead ? 0 : calculateReadingPoints(readingResult)),
        badges: calculateBadges(current, nextHistory)
      };
    });
  }

  function toggleTheme() {
    patchState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }));
  }

  function toggleListItem(field, id) {
    patchState((current) => {
      const set = new Set(current[field]);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...current, [field]: Array.from(set) };
    });
  }

  function resetProgress() {
    patchState((current) => ({
      ...current,
      readingHistory: [],
      comprehensionHistory: [],
      points: 0,
      badges: []
    }));
    setView("home");
  }

  if (!state.studentProfile?.name?.trim()) {
    return <Profile profile={state.studentProfile} onSave={saveProfile} isFirstRun />;
  }

  let page = null;
  if (view === "home") page = <Home state={state} texts={texts} setView={setView} onResetProgress={resetProgress} />;
  if (view === "library") {
    page = (
      <Library
        texts={texts}
        state={state}
        onStart={startText}
        toggleFavorite={(id) => toggleListItem("favorites", id)}
        toggleReadLater={(id) => toggleListItem("readLater", id)}
      />
    );
  }
  if (view === "daily") page = <DailyReading texts={texts} state={state} onStart={startText} />;
  if (view === "weekly") page = <WeeklyProgram texts={texts} state={state} onComplete={completeComprehension} />;
  if (view === "reading") {
    page = (
      <ReadingPage
        text={activeText}
        theme={state.theme}
        toggleTheme={toggleTheme}
        onBack={() => setView("library")}
        isRead={state.readingHistory.some((item) => item.textId === activeText?.id)}
        onComplete={completeReading}
      />
    );
  }
  if (view === "progress") page = <Progress state={state} />;
  if (view === "profile") page = <Profile profile={state.studentProfile} onSave={saveProfile} />;
  if (view === "teacher") page = <TeacherPanel state={state} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <Header profile={state.studentProfile} view={view} setView={setView} theme={state.theme} toggleTheme={toggleTheme} />
      {page}
      <BottomNav view={view} setView={setView} />
    </div>
  );
}
