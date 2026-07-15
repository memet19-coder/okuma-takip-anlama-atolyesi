export default function ProgressChart({ title, data, valueSuffix = "" }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <section className="card">
      <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={item.label} className="grid grid-cols-[72px_1fr_52px] items-center gap-3 text-sm">
            <span className="truncate font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(100, (item.value / max) * 100)}%` }}
              />
            </div>
            <span className="text-right font-bold text-slate-800 dark:text-slate-100">
              {item.value}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
