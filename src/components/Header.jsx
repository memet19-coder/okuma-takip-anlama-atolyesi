import { GraduationCap, Moon, Sun } from "lucide-react";

export default function Header({ profile, view, setView, theme, toggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <button className="flex items-center gap-3.5 text-left" onClick={() => setView("home")}>
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
            <img src={`${import.meta.env.BASE_URL}MG-logo.png`} alt="MG" className="h-full w-full scale-[1.6] object-contain" />
          </span>
          <span className="leading-none">
            <span className="block text-lg font-black leading-tight text-slate-950 dark:text-white">
              Okuma Atölyesi
            </span>
            <span className="mt-1 hidden text-sm font-medium leading-tight text-slate-500 sm:block">Takip ve Anlama</span>
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
