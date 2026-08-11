import useSWR from "swr";
import { supabase } from "@/utils/supabase";

/**
 * Fetches the highest stop_time_seconds value across all time_logs for a specific account.
 * Returns the raw integer seconds directly — no conversion needed post-Phase 5.
 *
 * @returns {number} The latest global stop time in total seconds from midnight.
 */
export const latestGlobalStopFetcher = async (keyArg = []) => {
  const accountId = Array.isArray(keyArg) ? keyArg[1] : keyArg;
  if (!accountId) return 0;

  const { data, error } = await supabase
    .from("time_logs")
    .select("stop_time_seconds")
    .eq("account_id", accountId)
    .order("stop_time_seconds", { ascending: false })
    .limit(1);

  if (error) throw error;

  const latestSeconds =
    data && data.length > 0 && data[0].stop_time_seconds !== undefined
      ? data[0].stop_time_seconds
      : 0;

  return latestSeconds;
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
