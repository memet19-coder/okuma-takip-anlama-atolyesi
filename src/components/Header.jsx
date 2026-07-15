import { BookOpen, GraduationCap, Moon, Sun } from "lucide-react";

export default function Header({ profile, view, setView, theme, toggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <button className="flex items-center gap-3 text-left" onClick={() => setView("home")}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
            <BookOpen size={24} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight text-slate-950 dark:text-white">
              Okuma Atolyesi
            </span>
            <span className="hidden text-sm text-slate-500 sm:block">Takip ve Anlama</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 md:flex dark:bg-slate-900">
          {[
            ["home", "Ana Sayfa"],
            ["weekly", "Haftalık Program"],
            ["library", "Kütüphane"],
            ["progress", "İlerleme"],
            ["teacher", "Öğretmen"]
          ].map(([key, label]) => (
            <button
              key={key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === key ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="icon-button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Açık tema" : "Koyu tema"}
            aria-label={theme === "dark" ? "Açık tema" : "Koyu tema"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 sm:flex dark:border-slate-800 dark:text-slate-200"
            onClick={() => setView("profile")}
          >
            <GraduationCap size={18} />
            {profile?.name || "Profil"}
          </button>
        </div>
      </div>
    </header>
  );
}
