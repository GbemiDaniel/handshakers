import useSWR from "swr";
import { supabase } from "@/utils/supabase";
import { getCurrentCycleBoundaries } from "@/utils/timeUtils";

/**
 * Fetches the chronologically most recent stop_time_seconds for the current
 * weekly cycle. If the latest log in the database was created before the
 * Monday morning platform cross (Pacific midnight), it belongs to the
 * previous cycle and the odometer resets to 0.
 *
 * Query fixes applied (see diagnostic reports):
 *   1. Orders by `created_at DESC` (chronological) instead of
 *      `stop_time_seconds DESC` (value-based global max).
 *   2. Selects `created_at` alongside `stop_time_seconds` so the cycle
 *      boundary check can compare the log's insertion timestamp against
 *      the Monday midnight anchor.
 *   3. Returns `0` when the most recent log predates the current cycle,
 *      unblocking the odometer reset.
 *
 * @returns {number} The latest global stop time in total seconds, or 0 if
 *                   no logs exist in the current cycle.
 */
export const latestGlobalStopFetcher = async (keyArg = []) => {
  const accountId = Array.isArray(keyArg) ? keyArg[1] : keyArg;
  if (!accountId) return 0;

  const { data, error } = await supabase
    .from("time_logs")
    .select("stop_time_seconds, created_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  // No logs at all — fresh workspace, return 0
  if (!data || data.length === 0 || data[0].stop_time_seconds === undefined) {
    return 0;
  }

  const latestLog = data[0];

  // Cycle boundary check: if the most recent log was created before
  // Monday 00:00 Pacific (the platform cross), it belongs to the
  // previous cycle. The odometer resets to 0 for the new week.
  const { pacificMidnightUTC } = getCurrentCycleBoundaries();
  const logCreatedAt = new Date(latestLog.created_at).getTime();

  if (logCreatedAt < pacificMidnightUTC) {
    return 0;
  }

  return latestLog.stop_time_seconds;
};

export function useLatestGlobalStop(accountId) {
  // Use array key to automatically re-fetch when accountId changes
  return useSWR(
    accountId ? ["latest-global-stop", accountId] : null,
    latestGlobalStopFetcher,
    {
      refreshInterval: 2000,
    }
  );
}
