export const GAME_TITLE = "Rail Match";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  background: "#d8d8d8",
  backgroundDark: "#c9ced4",

  panel: "#ffffff",
  panelBorder: "#1f2937",
  text: "#111827",
  mutedText: "#475569",

  red: "#ef4444",
  redLight: "#f87171",
  blue: "#3b82f6",
  blueLight: "#60a5fa",

  houseOutline: "#1f2937",
  trainOutline: "#1f2937",

  railMetal: "#d5d9e0",
  railMetalDark: "#4b5563",
  tie: "#9a6436",
  tieDark: "#5f381c",

  switchHighlight: "#ffe066",
  switchBase: "#475569",
  switchRing: "#111827",

  success: "#16a34a",
  danger: "#dc2626",
  warning: "#f59e0b",
  paused: "#6366f1",

  shadow: "rgba(17, 24, 39, 0.18)",
};

export const HOUSE_WIDTH = 82;
export const HOUSE_HEIGHT = 70;

export const TRAIN_WIDTH = 36;
export const TRAIN_HEIGHT = 22;

export const RAIL_WIDTH = 8;
export const RAIL_GAP = 18;

export const TIE_WIDTH = 34;
export const TIE_HEIGHT = 10;
export const TIE_SPACING = 28;

export const SWITCH_RADIUS = 16;
export const SWITCH_HIT_RADIUS = 28;

export const MAX_DELTA_TIME = 0.05;

export const FX_DURATIONS = {
  switchFlash: 180,
  housePulse: 450,
  failFlash: 500,
};

export const STORAGE_KEYS = {
  unlockedLevel: "rail-match-unlocked-level",
  selectedLevel: "rail-match-selected-level",
};