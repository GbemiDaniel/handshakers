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
