import useSWR from "swr";
import { supabase } from "@/utils/supabase";
import { getCurrentCycleBoundaries } from "@/utils/timeUtils";

const NO_ENTRY = { stopSeconds: 0, latest: null };

/**
 * Fetches the chronologically most recent log in a workspace.
 *
 * - `stopSeconds`: where the next handoff starts. 0 when there are no logs, or
 *   when the newest log was created before Monday 00:00 Pacific — it belongs to
 *   the previous cycle and the odometer resets.
 * - `latest`: that newest log's owner and cycle, or null if there are none. The
 *   undo button uses it so it only appears when undo would actually succeed.
 *
 * Orders by created_at (chronological), not stop_time_seconds (value), to match
 * what undo_last_time_log treats as the top of the stack.
 *
 * @returns {{ stopSeconds: number, latest: null | { userId: string, inCurrentCycle: boolean } }}
 */
export const latestGlobalStopFetcher = async (keyArg = []) => {
  const accountId = Array.isArray(keyArg) ? keyArg[1] : keyArg;
  if (!accountId) return NO_ENTRY;

  const { data, error } = await supabase
    .from("time_logs")
    .select("stop_time_seconds, created_at, user_id")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0 || data[0].stop_time_seconds === undefined) {
    return NO_ENTRY;
  }

  const latestLog = data[0];
  const { pacificMidnightUTC } = getCurrentCycleBoundaries();
  const inCurrentCycle = new Date(latestLog.created_at).getTime() >= pacificMidnightUTC;

  return {
    stopSeconds: inCurrentCycle ? latestLog.stop_time_seconds : 0,
    latest: { userId: latestLog.user_id, inCurrentCycle },
  };
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
