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
    text: "text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
    dot: "bg-blue-500",
    shadow: "shadow-blue-500/20",
  },
  {
    bg: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    shadow: "shadow-emerald-500/20",
  },
  {
    bg: "bg-violet-500",
    hoverBg: "hover:bg-violet-600",
    text: "text-violet-700 dark:text-violet-300",
    badgeBg: "bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/60",
    dot: "bg-violet-500",
    shadow: "shadow-violet-500/20",
  },
  {
    bg: "bg-amber-500",
    hoverBg: "hover:bg-amber-600",
    text: "text-amber-800 dark:text-amber-300",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
    dot: "bg-amber-500",
    shadow: "shadow-amber-500/20",
  },
  {
    bg: "bg-rose-500",
    hoverBg: "hover:bg-rose-600",
    text: "text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60",
    dot: "bg-rose-500",
    shadow: "shadow-rose-500/20",
  },
  {
    bg: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-600",
    text: "text-cyan-800 dark:text-cyan-300",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800/60",
    dot: "bg-cyan-500",
    shadow: "shadow-cyan-500/20",
  },
  {
    bg: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-600",
    text: "text-indigo-700 dark:text-indigo-300",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60",
    dot: "bg-indigo-500",
    shadow: "shadow-indigo-500/20",
  },
  {
    bg: "bg-teal-500",
    hoverBg: "hover:bg-teal-600",
    text: "text-teal-800 dark:text-teal-300",
    badgeBg: "bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/60",
    dot: "bg-teal-500",
    shadow: "shadow-teal-500/20",
  },
  {
    bg: "bg-fuchsia-500",
    hoverBg: "hover:bg-fuchsia-600",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-950/50 border-fuchsia-200 dark:border-fuchsia-800/60",
    dot: "bg-fuchsia-500",
    shadow: "shadow-fuchsia-500/20",
  },
  {
    bg: "bg-orange-500",
    hoverBg: "hover:bg-orange-600",
    text: "text-orange-800 dark:text-orange-300",
    badgeBg: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60",
    dot: "bg-orange-500",
    shadow: "shadow-orange-500/20",
  },
  {
    bg: "bg-sky-500",
    hoverBg: "hover:bg-sky-600",
    text: "text-sky-800 dark:text-sky-300",
    badgeBg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60",
    dot: "bg-sky-500",
    shadow: "shadow-sky-500/20",
  },
  {
    bg: "bg-pink-500",
    hoverBg: "hover:bg-pink-600",
    text: "text-pink-700 dark:text-pink-300",
    badgeBg: "bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800/60",
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
