import { Award } from "lucide-react";

export default function BadgeCard({ badge, locked }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${locked ? "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>
      <Award size={22} aria-hidden="true" />
      <span className="text-sm font-bold">{badge}</span>
    </div>
  );
}
