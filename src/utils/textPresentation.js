import { comprehensionProgram } from "../data/comprehensionProgram.js";

const NARRATIVE_TYPES = new Set(["Hikaye", "Hikâye", "Kısa öykü", "Masal", "Fabl"]);
const GENERIC_KEYWORDS = new Set(["okuma", "bağımsız okuma"]);
const TOPIC_OVERRIDES = {
  "metin-004": "Planlama ve görev paylaşımının ortak çalışmaya katkısı",
  "metin-009": "Kitap önerileri aracılığıyla kurulan okuma dostluğu",
  "metin-013": "Bir tohumun sabır ve düzenli bakımla büyümesi",
  "metin-015": "Merakını çalışmayla birleştiren bir öğrencinin bilimsel hedeflerine ilerlemesi",
  "metin-017": "Bir öğrencinin sanatta renkleri özgürce kullanmayı öğrenmesi",
  "metin-018": "Hatalardan ders çıkarıp düzenli çalışarak başarıya ulaşma",
  "pd-omer-keramet-01": "İnsanların çıkarları uğruna olağan olaylara keramet anlamı yüklemesi",
  "pd-omer-elma-01": "Yoksulluk içindeki bir çocuğun küçük bir isteğinin çevresindeki insanları etkilemesi",
  "pd-masal-tembel-kiz-01": "Tembelliğin yol açtığı güçlükler ve çalışkanlığın değeri",
  "pd-masal-kiymetli-tuz-01": "Günlük hayatta sıradan görünen şeylerin gerçek değerini anlama",
  "pd-masal-karanan-ile-tilki-01": "Aldatmanın sonuçları, hatayı telafi etme ve dürüst davranma"
};
const STOP_WORDS = new Set([
  "acaba", "ama", "ancak", "arasında", "artık", "ayrıca", "bana", "bazı", "belirli", "ben", "beri", "bile", "bir", "biraz",
  "birçok", "biz", "böyle", "böylece", "bütün", "çok", "çünkü", "daha", "dahi", "değil", "diğer", "diye", "dolayı",
  "dolayısıyla", "en", "fakat", "gibi", "göre", "hem", "hep", "her", "hiç", "için", "ile", "ise", "kadar", "kendi",
  "ki", "kim", "nasıl", "neden", "olan", "olarak", "olduğu", "olur", "onlar", "onu", "pek", "rağmen", "sadece", "sonra",
  "şekilde", "şey", "tarafından", "tüm", "üzerinde", "üzere", "var", "ve", "veya", "ya", "yani", "yer", "yerine", "yine"
]);

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function splitSentences(value) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return [...new Intl.Segmenter("tr", { granularity: "sentence" }).segment(value)]
      .map(({ segment }) => segment.trim())
      .filter(Boolean);
  }
  return value.match(/[^.!?…]+(?:[.!?…]+["”’)]?|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [value];
}

export function splitTextIntoParagraphs(content) {
  const sourceParagraphs = content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const result = [];

  for (const source of sourceParagraphs) {
    const totalWords = wordCount(source);
    if (totalWords <= 150) {
      result.push(source);
      continue;
    }

    const targetWords = totalWords >= 360 ? 100 : totalWords >= 240 ? 90 : 75;
    const sentences = splitSentences(source);
    let current = [];
    let currentWords = 0;
    let consumedWords = 0;

    for (const sentence of sentences) {
      const sentenceWords = wordCount(sentence);
      current.push(sentence);
      currentWords += sentenceWords;
      consumedWords += sentenceWords;
      const remainingWords = totalWords - consumedWords;
      if (currentWords >= targetWords && remainingWords >= 45) {
        result.push(current.join(" "));
        current = [];
        currentWords = 0;
      }
    }

    if (current.length) result.push(current.join(" "));
  }

  return result;
}

function getProgramAnswer(textId, type) {
  const assignment = comprehensionProgram.find((item) => item.textId === textId);
  return assignment?.questions.find((question) => question.type === type)?.answer;
}

function concise(value, maxLength = 220) {
  if (!value || value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength);
  return `${shortened.slice(0, shortened.lastIndexOf(" ")).trim()}...`;
}

function keywordStems(value) {
  const words = normalizeKeyword(value).split(" ").filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
  return new Set(words.map((word) => word.slice(0, word.length >= 7 ? 5 : 4)));
}

function selectMainIdeaSentence(text) {
  const sentences = splitSentences(text.content.replace(/\s+/g, " ").trim());
  if (NARRATIVE_TYPES.has(text.type)) return sentences.at(-1);

  const focusStems = keywordStems(`${text.title} ${getProgramAnswer(text.id, "Konu") || ""}`);
  const signals = ["bu nedenle", "böylece", "önemli", "gerekir", "sağlar", "gösterir", "korum", "yalnızca", "sadece", "asıl", "temel"];

  return sentences
    .map((sentence, index) => {
      const normalized = normalizeKeyword(sentence);
      const sentenceStems = keywordStems(sentence);
      const overlap = [...focusStems].filter((stem) => sentenceStems.has(stem)).length;
      const words = wordCount(sentence);
      const signalScore = signals.reduce((score, signal) => score + (normalized.includes(signal) ? 1.2 : 0), 0);
      const positionScore = index === 0 ? 1 : index === sentences.length - 1 ? 0.6 : 0;
      const lengthScore = words >= 8 && words <= 32 ? 1 : words < 5 || words > 45 ? -1 : 0;
      const detailPenalty = /\b\d{3,4}\b/.test(sentence) ? 0.8 : 0;
      return { sentence, score: overlap * 1.5 + signalScore + positionScore + lengthScore - detailPenalty };
    })
    .sort((left, right) => right.score - left.score)[0]?.sentence;
}

export function getTextTopic(text) {
  const preparedTopic = getProgramAnswer(text.id, "Konu") || TOPIC_OVERRIDES[text.id];
  if (preparedTopic) return preparedTopic;

  const title = text.title.replace(/[?.!]$/, "");
  if (text.type === "Sanat metni") {
    return `${title}: anlatım biçimleri, temel özellikler ve sanat dünyasındaki yeri`;
  }
  if (text.type === "Araştırma metni") {
    return `${title}: araştırmadaki amacı, uygulanışı ve bilgi üretimine katkısı`;
  }
  if (text.type === "Bilim metni" || text.type === "Bilimsel metin") {
    return `${title}: temel özellikler, işleyiş ve bilimsel açıdan önemi`;
  }

  const mainIdea = getProgramAnswer(text.id, "Ana fikir");
  if (mainIdea) return concise(mainIdea.replace(/[.!?]$/, ""), 150);
  return `${text.topic}: metinde ele alınan temel olaylar ve düşünceler`;
}

export function getTextMainIdea(text) {
  const programAnswer = getProgramAnswer(text.id, "Ana fikir");
  if (programAnswer) return programAnswer;
  if (text.mainIdea) return text.mainIdea;

  const candidate = selectMainIdeaSentence(text);
  return concise(candidate || text.content);
}

function normalizeKeyword(value) {
  return value.toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü0-9\s-]/gi, " ").replace(/\s+/g, " ").trim();
}

function answerKeywords(textId) {
  const answer = getProgramAnswer(textId, "Anahtar kelimeler");
  return answer ? answer.replace(/[.]$/, "").split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function getTextKeywords(text) {
  const result = [];
  const seen = new Set();
  const add = (value) => {
    const normalized = normalizeKeyword(value);
    if (!normalized || GENERIC_KEYWORDS.has(normalized) || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(value.trim());
  };

  answerKeywords(text.id).forEach(add);
  (text.keywords || []).forEach(add);

  if (result.length < 4) {
    const frequencies = new Map();
    const words = text.content.match(/[A-Za-zÇĞİÖŞÜçğıöşü]{4,}/g) || [];
    for (const word of words) {
      const normalized = word.toLocaleLowerCase("tr-TR");
      if (
        STOP_WORDS.has(normalized)
        || [...seen].some((keyword) => keyword.includes(normalized) || normalized.includes(keyword))
      ) continue;
      const current = frequencies.get(normalized) || { count: 0, label: normalized };
      current.count += 1;
      frequencies.set(normalized, current);
    }
    [...frequencies.values()]
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "tr"))
      .slice(0, 8)
      .forEach(({ label }) => {
        if (result.length < 4) add(label);
      });
  }

  return result.slice(0, 5);
}
