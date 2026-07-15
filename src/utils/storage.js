const STORAGE_KEY = "okumaAtolyesiState";

export const initialState = {
  studentProfile: null,
  readingHistory: [],
  comprehensionHistory: [],
  points: 0,
  badges: [],
  favorites: [],
  readLater: [],
  cloudRevision: 0,
  theme: "light"
};

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    return { ...initialState, ...JSON.parse(stored) };
  } catch (error) {
    console.warn("Kayitli veriler okunamadi.", error);
    return initialState;
  }
}

export function saveState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    console.warn("Veriler kaydedilemedi.", error);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function updateState(updater) {
  const current = loadState();
  const next = typeof updater === "function" ? updater(current) : updater;
  saveState(next);
  return next;
}
