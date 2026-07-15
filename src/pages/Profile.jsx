import { useState } from "react";

const types = ["Hikaye", "Kısa öykü", "Fabl", "Bilgilendirici metin", "Deneme", "Biyografi", "Teknoloji metni", "Doğa ve çevre metni", "Tarih metni"];

export default function Profile({ profile, onSave, isFirstRun = false }) {
  const initial = profile || {
    name: "",
    grade: 6,
    dailyGoal: 1,
    preferredTypes: ["Hikaye"],
    readingLevel: "Kolay"
  };
  const [current, setCurrent] = useState(initial);

  function update(field, value) {
    setCurrent((valueNow) => ({ ...valueNow, [field]: value }));
  }

  function toggleType(type) {
    const selected = new Set(current.preferredTypes || []);
    selected.has(type) ? selected.delete(type) : selected.add(type);
    update("preferredTypes", Array.from(selected));
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="section-eyebrow">{isFirstRun ? "Hoş geldin" : "Profil"}</p>
          <h1 className="page-title">{isFirstRun ? "Okuma yolculuğunu hazırlayalım" : "Profil ayarları"}</h1>
          <p className="page-subtitle">Profilin bu cihazda korunur; tamamladığın okumalar öğretmenin takip edebilmesi için güvenli biçimde eşitlenir.</p>
        </div>

        <div className="card space-y-5">
          <label className="field-label">
            Adın
            <input className="input" value={current.name} onChange={(event) => update("name", event.target.value)} placeholder="Örn. Ayşe" />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">
              Sınıf
              <select className="input" value={current.grade} onChange={(event) => update("grade", Number(event.target.value))}>
                {[5, 6, 7, 8].map((grade) => <option key={grade} value={grade}>{grade}. sınıf</option>)}
              </select>
            </label>
            <label className="field-label">
              Günlük hedef
              <select className="input" value={current.dailyGoal} onChange={(event) => update("dailyGoal", Number(event.target.value))}>
                {[1, 2, 3].map((goal) => <option key={goal} value={goal}>{goal} metin</option>)}
              </select>
            </label>
            <label className="field-label">
              Okuma seviyesi
              <select className="input" value={current.readingLevel} onChange={(event) => update("readingLevel", event.target.value)}>
                {["Kolay", "Orta", "Zor"].map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
          </div>

          <div>
            <p className="field-label mb-2">Sevdiğin metin türleri</p>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    current.preferredTypes?.includes(type)
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                      : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300"
                  }`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {!current.name.trim() && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Başlamak için adını yazman yeterli.
            </p>
          )}

          <button
            className="primary-button w-full justify-center"
            disabled={!current.name.trim()}
            onClick={() => onSave({ ...current, name: current.name.trim() })}
          >
            {isFirstRun ? "Başla" : "Profili Kaydet"}
          </button>
        </div>
      </section>
    </main>
  );
}
