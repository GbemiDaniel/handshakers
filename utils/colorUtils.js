/**
 * Array of 12 distinct, visually appealing Tailwind background classes.
 * Written as full, uninterrupted strings so Tailwind JIT compiler detects them.
 */
export const USER_COLOR_CLASSES = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-orange-500",
  "bg-sky-500",
  "bg-pink-500",
];

/**
 * Extended color themes for rich UI components with matching badges, dots, and contrast text.
 */
export const USER_COLOR_THEMES = [
  {
    bg: "bg-blue-500",
    hoverBg: "hover:bg-blue-600",
    text: "text-blue-700",
    badgeBg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    shadow: "shadow-blue-500/20",
  },
  {
    bg: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-600",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    shadow: "shadow-emerald-500/20",
  },
  {
    bg: "bg-violet-500",
    hoverBg: "hover:bg-violet-600",
    text: "text-violet-700",
    badgeBg: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    shadow: "shadow-violet-500/20",
  },
  {
    bg: "bg-amber-500",
    hoverBg: "hover:bg-amber-600",
    text: "text-amber-800",
    badgeBg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    shadow: "shadow-amber-500/20",
  },
  {
    bg: "bg-rose-500",
    hoverBg: "hover:bg-rose-600",
    text: "text-rose-700",
    badgeBg: "bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
    shadow: "shadow-rose-500/20",
  },
  {
    bg: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-600",
    text: "text-cyan-800",
    badgeBg: "bg-cyan-50 border-cyan-200",
    dot: "bg-cyan-500",
    shadow: "shadow-cyan-500/20",
  },
  {
    bg: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-600",
    text: "text-indigo-700",
    badgeBg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    shadow: "shadow-indigo-500/20",
  },
  {
    bg: "bg-teal-500",
    hoverBg: "hover:bg-teal-600",
    text: "text-teal-800",
    badgeBg: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    shadow: "shadow-teal-500/20",
  },
  {
    bg: "bg-fuchsia-500",
    hoverBg: "hover:bg-fuchsia-600",
    text: "text-fuchsia-700",
    badgeBg: "bg-fuchsia-50 border-fuchsia-200",
    dot: "bg-fuchsia-500",
    shadow: "shadow-fuchsia-500/20",
  },
  {
    bg: "bg-orange-500",
    hoverBg: "hover:bg-orange-600",
    text: "text-orange-800",
    badgeBg: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
    shadow: "shadow-orange-500/20",
  },
  {
    bg: "bg-sky-500",
    hoverBg: "hover:bg-sky-600",
    text: "text-sky-800",
    badgeBg: "bg-sky-50 border-sky-200",
    dot: "bg-sky-500",
    shadow: "shadow-sky-500/20",
  },
  {
    bg: "bg-pink-500",
    hoverBg: "hover:bg-pink-600",
    text: "text-pink-700",
    badgeBg: "bg-pink-50 border-pink-200",
    dot: "bg-pink-500",
    shadow: "shadow-pink-500/20",
  },
];

/**
 * Converts a string userId into a positive integer hash.
 */
export function hashUserId(userId) {
  if (!userId || typeof userId !== "string") return 0;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Deterministically returns a single Tailwind background color class for a userId.
 * Example: getUserColorClass("user-123") -> "bg-violet-500"
 */
export function getUserColorClass(userId) {
  const hash = hashUserId(userId);
  return USER_COLOR_CLASSES[hash % USER_COLOR_CLASSES.length];
}

/**
 * Deterministically returns a complete color theme object for a userId.
 */
export function getUserColorTheme(userId) {
  const hash = hashUserId(userId);
  return USER_COLOR_THEMES[hash % USER_COLOR_THEMES.length];
}
