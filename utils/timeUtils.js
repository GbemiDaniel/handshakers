/**
 * Unified Time Conversion Utilities — Phase 2 Seconds Precision
 *
 * All functions operate on integer seconds as the canonical unit.
 * These replace the legacy `timeToTotalMinutes` / `minutesToHHMMString`
 * functions that were scattered across individual components.
 */

/**
 * Converts an HH:MM or HH:MM:SS string into total seconds from midnight.
 *
 * Accepts:
 *   - "08:35"    → 30900   (HH:MM, seconds default to 0)
 *   - "08:35:45" → 30945   (HH:MM:SS)
 *
 * @param {string} timeStr — Time string in HH:MM or HH:MM:SS format.
 * @returns {number} Total seconds from midnight. Returns 0 for falsy/invalid input.
 * @throws {Error} If numeric ranges are invalid (minutes > 59, seconds > 59, negatives).
 */
export function timeToTotalSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);

  // Must have at least HH:MM (2 parts), at most HH:MM:SS (3 parts)
  if (parts.length < 2 || parts.length > 3) return 0;

  // Bail out on NaN from non-numeric segments (e.g. "ab:cd")
  if (parts.some(isNaN)) return 0;

  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Converts total seconds into an HH:MM display string.
 * Truncates seconds — use `secondsToHHMMSSString` for full precision.
 *
 * @param {number} totalSeconds — Total seconds from midnight.
 * @returns {string} Formatted "HH:MM" string (e.g. 30900 → "08:35").
 */
export function secondsToHHMMString(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "00:00";
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${formattedHours}:${formattedMins}`;
}

/**
 * Converts total seconds into an HH:MM:SS display string.
 * Preserves full precision — no truncation.
 *
 * @param {number} totalSeconds — Total seconds from midnight.
 * @returns {string} Formatted "HH:MM:SS" string (e.g. 30945 → "08:35:45").
 */
export function secondsToHHMMSSString(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "00:00:00";
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${formattedHours}:${formattedMins}:${formattedSecs}`;
}

/**
 * Smart display formatter: returns HH:MM if seconds component is 0,
 * otherwise returns HH:MM:SS. Used for user-facing display contexts
 * where trailing ":00" is visual noise.
 *
 * @param {number} totalSeconds — Total seconds from midnight.
 * @returns {string} "HH:MM" or "HH:MM:SS" depending on precision needed.
 */
export function secondsToSmartDisplay(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "00:00";
  const absSeconds = Math.abs(totalSeconds);
  const secs = absSeconds % 60;
  return secs === 0 ? secondsToHHMMString(totalSeconds) : secondsToHHMMSSString(totalSeconds);
}

/**
 * Computes the current weekly cycle boundaries anchored to Monday 00:00
 * in the America/Los_Angeles (Pacific) timezone.
 *
 * This is the single source of truth for the "platform cross" — the moment
 * the cumulative odometer resets each week. Extracted from usePayoutCalculator
 * so that useLatestGlobalStop can share the same cycle awareness.
 *
 * @returns {{ pacificMidnightUTC: number, pacificNoonUTC: number, dateLabels: { current: string, previous: string } }}
 *   - pacificMidnightUTC: Monday 00:00 Pacific as a UTC epoch (ms).
 *   - pacificNoonUTC:     Monday 12:00 Pacific as a UTC epoch (ms). Hard cutoff boundary.
 *   - dateLabels:         Human-readable date range strings for current and previous cycles.
 */
export function getCurrentCycleBoundaries() {
  const now = new Date();

  const laFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  });

  const laLocal = new Date(laFormatter.format(now));

  const day = laLocal.getDay();
  const diff = laLocal.getDate() - day + (day === 0 ? -6 : 1);

  const y = laLocal.getFullYear();
  const m = laLocal.getMonth();
  const d = diff;

  const approximateEpoch = Date.UTC(y, m, d, 8, 0, 0, 0);

  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset'
  });

  const parts = offsetFormatter.formatToParts(new Date(approximateEpoch));
  const offsetStr = parts.find(p => p.type === 'timeZoneName').value;

  let offsetHours = -8;
  const match = offsetStr.match(/GMT([+-]\d+)/);
  if (match) {
    offsetHours = parseInt(match[1], 10);
  }

  const midnightEpoch = Date.UTC(y, m, d, 0, 0, 0, 0) - (offsetHours * 60 * 60 * 1000);
  const noonEpoch = midnightEpoch + (12 * 60 * 60 * 1000);

  const currentStart = new Date(midnightEpoch);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);

  const currentWeekEnd = new Date(currentStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

  const previousWeekEnd = new Date(previousStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

  const formatDate = (dateObj) => dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const labels = {
    current: `${formatDate(currentStart)} - ${formatDate(currentWeekEnd)}`,
    previous: `${formatDate(previousStart)} - ${formatDate(previousWeekEnd)}`
  };

  return {
    pacificMidnightUTC: midnightEpoch,
    pacificNoonUTC: noonEpoch,
    dateLabels: labels
  };
}

// Workdays are dated on one fixed team calendar, matching the database's
// set_time_log_work_date trigger. Keep the two in sync.
export const TEAM_TIMEZONE = "Africa/Lagos";

/** Today's date on the team calendar, as "YYYY-MM-DD". */
export function todayInTeamZone(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TEAM_TIMEZONE }).format(now);
}

/** Shifts a "YYYY-MM-DD" date by whole days, without timezone drift. */
export function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Labels a workday: "Today", "Yesterday", or "Tuesday, Sep 22".
 * work_date is a calendar date, not an instant, so it is formatted in UTC to
 * stop the viewer's own timezone from shifting it by a day.
 */
export function formatWorkDate(dateStr, now = new Date()) {
  if (!dateStr) return "Unknown Date";
  const today = todayInTeamZone(now);
  if (dateStr === today) return "Today";
  if (dateStr === addDaysToDateString(today, -1)) return "Yesterday";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Short label for exports: "Tue 22/09". */
export function formatWorkDateShort(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayName = date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" });
  const dateNum = date.toLocaleDateString("en-GB", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
  return `${dayName} ${dateNum}`;
}
