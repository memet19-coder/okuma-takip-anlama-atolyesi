import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TextCard from "../components/TextCard.jsx";

const empty = "Tümü";

export default function Library({ texts, state, onStart, toggleFavorite, toggleReadLater }) {
  const [filters, setFilters] = useState({
    search: "",
    type: empty,
    topic: empty,
    read: empty
  });
  const [visibleCount, setVisibleCount] = useState(60);

  const readIds = new Set(state.readingHistory.map((item) => item.textId));
  const types = unique(texts.map((item) => item.type));
  const topics = unique(texts.map((item) => item.topic));

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLocaleLowerCase("tr-TR");
    return texts.filter((text) => {
      const haystack = [text.title, text.topic, text.type, ...(text.keywords || [])].join(" ").toLocaleLowerCase("tr-TR");
      const matchesQuery = !query || haystack.includes(query);
      const matchesType = filters.type === empty || text.type === filters.type;
      const matchesTopic = filters.topic === empty || text.topic === filters.topic;
      const matchesRead = filters.read === empty || (filters.read === "Okundu" ? readIds.has(text.id) : !readIds.has(text.id));
      return matchesQuery && matchesType && matchesTopic && matchesRead;
    });
  }, [filters, texts, state.readingHistory]);

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    setVisibleCount(60);
  }, [filters]);

  const visibleTexts = filtered.slice(0, visibleCount);

  return (
    <main className="page-shell">
      <div className="mb-6">
        <p className="section-eyebrow">Metin Kütüphanesi</p>
        <h1 className="page-title">Okuyacağın metni seç</h1>
        <p className="page-subtitle">Başlık, konu, tür veya anahtar kelimeye göre arama yapabilirsin.</p>
      </div>

      <section className="card mb-6">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            className="input pl-10"
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            placeholder="Başlık, konu, tür veya anahtar kelime ara"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Filter label="Tür" value={filters.type} onChange={(value) => setFilter("type", value)} options={[empty, ...types]} />
          <Filter label="Konu" value={filters.topic} onChange={(value) => setFilter("topic", value)} options={[empty, ...topics]} />
          <Filter label="Durum" value={filters.read} onChange={(value) => setFilter("read", value)} options={[empty, "Okundu", "Okunmadı"]} />
        </div>
      </section>

      {filtered.length ? (
        <>
          <div className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {filtered.length} metinden {visibleTexts.length} tanesi gösteriliyor. Okunan metinler yeşil renkle işaretlenir.
          </div>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTexts.map((text) => (
              <TextCard
                key={text.id}
                text={text}
                isRead={readIds.has(text.id)}
                isFavorite={state.favorites.includes(text.id)}
                isLater={state.readLater.includes(text.id)}
                onStart={onStart}
                onFavorite={toggleFavorite}
                onReadLater={toggleReadLater}
              />
            ))}
          </section>
          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button className="secondary-button" onClick={() => setVisibleCount((count) => count + 60)}>
                Daha fazla göster
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Sonuç bulunamadı</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Filtreleri değiştirerek yeniden deneyebilirsin.</p>
        </div>
      )}
    </main>
  );
}

function Filter({ label, value, onChange, options }) {
  return (
    <label className="field-label">
      {label}
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function unique(items) {
  return Array.from(new Set(items)).sort((a, b) => String(a).localeCompare(String(b), "tr"));
}
