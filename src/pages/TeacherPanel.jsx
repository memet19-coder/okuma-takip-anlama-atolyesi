import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Clock3, CloudOff, KeyRound, RefreshCw, Users } from "lucide-react";
import { isSupabaseConfigured, loadTeacherReadingReport } from "../utils/supabase.js";

export default function TeacherPanel({ state }) {
  const currentStudent = buildCurrentStudent(state);
  const [pin, setPin] = useState("");
  const [cloudStudents, setCloudStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const rows = isSupabaseConfigured ? cloudStudents : currentStudent ? [currentStudent] : [];
  const selectedStudent = rows.find((student) => student.id === selectedId) || rows[0];
  const totalRead = rows.reduce((sum, student) => sum + student.readCount, 0);
  const totalMinutes = rows.reduce((sum, student) => sum + student.readingMinutes, 0);
  const totalComprehension = rows.reduce((sum, student) => sum + student.comprehensionCount, 0);

  async function refreshReport() {
    if (!pin.trim()) {
      setError("Öğretmen PIN'ini yazmalısın.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const report = await loadTeacherReadingReport(pin.trim());
      const students = report.map(normalizeCloudStudent);
      setCloudStudents(students);
      setSelectedId((current) => students.some((student) => student.id === current) ? current : students[0]?.id || null);
      setLoaded(true);
    } catch (requestError) {
      const message = requestError.message || "";
      if (message.includes("TEACHER_PIN_NOT_CONFIGURED")) {
        setError("Supabase üzerinde öğretmen PIN'i henüz oluşturulmamış.");
      } else if (message.includes("TEACHER_PIN_INVALID")) {
        setError("Öğretmen PIN'i yanlış.");
      } else {
        setError("Öğrenci kayıtları alınamadı. Supabase bağlantısını ve veritabanı kurulumunu kontrol et.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="mb-6">
        <p className="section-eyebrow">Öğretmen Paneli</p>
        <h1 className="page-title">Sınıf okuma raporu</h1>
        <p className="page-subtitle">Öğrencilerin tamamladığı metinleri, okuma sürelerini ve haftalık çalışmalarını buradan takip edebilirsin.</p>
      </div>

      {isSupabaseConfigured ? (
        <section className="mb-6 border-y border-slate-200 py-5 dark:border-slate-800">
          <div className="flex flex-wrap items-end gap-3">
            <label className="field-label min-w-56 flex-1 sm:max-w-xs">
              Öğretmen PIN'i
              <div className="relative mt-2">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="input pl-10"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && refreshReport()}
                  placeholder="PIN"
                />
              </div>
            </label>
            <button className="primary-button" disabled={loading} onClick={refreshReport}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              {loaded ? "Kayıtları yenile" : "Kayıtları getir"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">{error}</p>}
        </section>
      ) : (
        <section className="mb-6 flex items-start gap-4 border-y border-amber-200 bg-amber-50/70 py-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <CloudOff className="mt-0.5 shrink-0" size={22} />
          <div>
            <p className="font-black">Bulut bağlantısı henüz etkin değil</p>
            <p className="mt-1 text-sm leading-6">Bu cihazdaki öğrenci aşağıda gösteriliyor. Supabase bilgileri eklendiğinde diğer cihazlardaki öğrenciler de burada görünecek.</p>
          </div>
        </section>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PanelCard icon={Users} title="Öğrenci sayısı" value={rows.length} />
        <PanelCard icon={BookOpen} title="Toplam okunan metin" value={totalRead} />
        <PanelCard icon={Clock3} title="Toplam okuma süresi" value={`${totalMinutes} dk`} />
        <PanelCard icon={BookOpen} title="Anlama çalışması" value={totalComprehension} />
      </section>

      {isSupabaseConfigured && !loaded ? (
        <EmptyState text="Öğrenci kayıtlarını görmek için öğretmen PIN'ini gir." />
      ) : rows.length === 0 ? (
        <EmptyState text="Henüz eşitlenmiş bir öğrenci kaydı yok." />
      ) : (
        <>
          <section className="overflow-hidden border-y border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-100/70 dark:bg-slate-900">
                  <tr>
                    {["Öğrenci", "Sınıf", "Okuduğu metin", "Anlama çalışması", "Toplam kelime", "Okuma süresi", "Son metin", ""].map((head) => (
                      <th key={head || "detail"} className="px-4 py-3 text-left text-sm font-bold text-slate-600 dark:text-slate-300">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((student) => (
                    <tr key={student.id} className={selectedStudent?.id === student.id ? "bg-blue-50 dark:bg-blue-950/30" : ""}>
                      <td className="px-4 py-4 font-bold text-slate-950 dark:text-white">{student.name}{student.isCurrent && <span className="ml-2 status-pill bg-blue-600 text-white">Bu cihaz</span>}</td>
                      <td className="px-4 py-4">{student.grade}. sınıf</td>
                      <td className="px-4 py-4"><span className="rounded-md bg-emerald-100 px-3 py-1 font-black text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">{student.readCount}</span></td>
                      <td className="px-4 py-4">{student.comprehensionCount}</td>
                      <td className="px-4 py-4">{student.wordCount.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-4">{student.readingMinutes} dk</td>
                      <td className="max-w-64 px-4 py-4">{student.lastText}</td>
                      <td className="px-4 py-4">
                        <button className="icon-button" aria-label={`${student.name} okuma ayrıntıları`} title="Okuma ayrıntıları" onClick={() => setSelectedId(student.id)}>
                          <ChevronRight size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {selectedStudent && <StudentReadingDetails student={selectedStudent} />}
        </>
      )}
    </main>
  );
}

function StudentReadingDetails({ student }) {
  const readings = useMemo(() => [...student.readingHistory].reverse(), [student.readingHistory]);
  return (
    <section className="mt-8" aria-labelledby="student-readings-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-eyebrow">Okuma ayrıntıları</p>
          <h2 id="student-readings-title" className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{student.name}</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Son güncelleme: {formatDateTime(student.updatedAt)}</p>
      </div>
      {readings.length === 0 ? (
        <p className="mt-5 border-y border-slate-200 py-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">Bu öğrenci henüz bir metin tamamlamadı.</p>
      ) : (
        <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {readings.map((reading, index) => (
            <article key={`${reading.textId}-${reading.date}-${index}`} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
              <div>
                <p className="font-black text-slate-950 dark:text-white">{reading.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{reading.type || reading.topic || "Okuma metni"}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatDate(reading.date)}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{reading.wordCount || 0} kelime · {reading.readingMinutes || 0} dk</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function normalizeCloudStudent(row) {
  return {
    id: row.student_id,
    name: row.student_name,
    grade: row.grade,
    readCount: row.read_count || 0,
    wordCount: row.word_count || 0,
    readingMinutes: row.reading_minutes || 0,
    comprehensionCount: Array.isArray(row.comprehension_history) ? row.comprehension_history.length : 0,
    lastText: row.last_text || "Henüz yok",
    activeDays: row.active_days || 0,
    readingHistory: Array.isArray(row.reading_history) ? row.reading_history : [],
    updatedAt: row.updated_at
  };
}

function buildCurrentStudent(state) {
  const profile = state?.studentProfile;
  if (!profile) return null;
  const history = state.readingHistory || [];
  return {
    id: "current-student",
    name: profile.name,
    grade: profile.grade,
    readCount: history.length,
    wordCount: history.reduce((sum, item) => sum + (item.wordCount || 0), 0),
    readingMinutes: history.reduce((sum, item) => sum + (item.readingMinutes || 0), 0),
    comprehensionCount: (state.comprehensionHistory || []).length,
    lastText: history.at(-1)?.title || "Henüz yok",
    activeDays: new Set(history.map((item) => item.date)).size,
    readingHistory: history,
    updatedAt: new Date().toISOString(),
    isCurrent: true
  };
}

function PanelCard({ icon: Icon, title, value }) {
  return (
    <article className="card">
      <Icon size={20} className="text-blue-700 dark:text-blue-300" />
      <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

function EmptyState({ text }) {
  return <p className="border-y border-slate-200 py-10 text-center font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">{text}</p>;
}

function formatDate(value) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) return "Yerel kayıt";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
