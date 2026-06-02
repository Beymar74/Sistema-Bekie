export const PROGRESS_EVENT = "bekie-progress";

export type ProgressKey =
  | "bekie-level-0-progress"
  | "bekie-level-2-progress"
  | "bekie-level-3-progress";

const COMPLETED_SUFFIX = ":completed";

function completedKey(key: ProgressKey) {
  return `${key}${COMPLETED_SUFFIX}`;
}

export function readMissionProgress(key: ProgressKey, maxMissions: number): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const currentCompleted = window.localStorage.getItem(completedKey(key));
  if (currentCompleted !== null) {
    const parsed = Number(currentCompleted);
    const safe = Number.isNaN(parsed) ? 0 : parsed;
    return Math.min(maxMissions, Math.max(0, safe));
  }

  const legacyUnlocked = Number(window.localStorage.getItem(key) ?? "0");
  const legacySafe = Number.isNaN(legacyUnlocked) ? 0 : legacyUnlocked;
  const migratedCompleted = Math.max(0, legacySafe - 1);
  return Math.min(maxMissions, migratedCompleted);
}

export function unlockMissionAfterComplete(
  key: ProgressKey,
  completedMissionIndex: number,
  maxMissions: number
): number {
  const nextCompleted = Math.min(maxMissions, completedMissionIndex);
  const current = readMissionProgress(key, maxMissions);
  const completed = Math.max(current, nextCompleted);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(completedKey(key), String(completed));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }

  return completed;
}

export function subscribeMissionProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROGRESS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
  };
}

export const LOAD_PAYLOAD_KEY = "bekie-robot-load-payload";

export interface RobotLoadPayload {
  levelKey: string;
  missionIndex: number;
  missionTitle: string;
  commands: string[];
}

export function saveRobotLoadPayload(payload: RobotLoadPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(LOAD_PAYLOAD_KEY, JSON.stringify(payload));
}

export function readRobotLoadPayload(): RobotLoadPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(LOAD_PAYLOAD_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RobotLoadPayload;
  } catch {
    return null;
  }
}

export function clearRobotLoadPayload() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(LOAD_PAYLOAD_KEY);
  }
}
