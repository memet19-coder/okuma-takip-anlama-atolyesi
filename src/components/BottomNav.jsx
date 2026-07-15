import { BarChart3, Brain, Home, Library, UserRound } from "lucide-react";

const items = [
  { key: "home", label: "Ana", icon: Home },
  { key: "weekly", label: "Program", icon: Brain },
  { key: "library", label: "Kütüphane", icon: Library },
  { key: "progress", label: "İlerleme", icon: BarChart3 },
  { key: "profile", label: "Profil", icon: UserRound }
];

export default function BottomNav({ view, setView }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 md:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold ${
              view === key ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200" : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setView(key)}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
