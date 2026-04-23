import { STORAGE_KEYS } from "./constants";

export function loadUnlockedLevelIndex(maxIndex) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.unlockedLevel);
    if (raw == null) return 0;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 0;

    return Math.max(0, Math.min(maxIndex, Math.floor(parsed)));
  } catch {
    return 0;
  }
}

export function saveUnlockedLevelIndex(index) {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.unlockedLevel,
      String(Math.max(0, Math.floor(index)))
    );
  } catch {
    // ignore storage failures
  }
}

export function loadSelectedLevelIndex(maxIndex, unlockedIndex) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.selectedLevel);
    if (raw == null) return Math.max(0, Math.min(maxIndex, unlockedIndex));

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return Math.max(0, Math.min(maxIndex, unlockedIndex));
    }

    return Math.max(0, Math.min(Math.floor(parsed), unlockedIndex, maxIndex));
  } catch {
    return Math.max(0, Math.min(maxIndex, unlockedIndex));
  }
}

export function saveSelectedLevelIndex(index) {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.selectedLevel,
      String(Math.max(0, Math.floor(index)))
    );
  } catch {
    // ignore storage failures
  }
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.unlockedLevel);
    window.localStorage.removeItem(STORAGE_KEYS.selectedLevel);
  } catch {
    // ignore storage failures
  }
}