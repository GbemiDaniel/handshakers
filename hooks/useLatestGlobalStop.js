import useSWR from "swr";
import { supabase } from "@/utils/supabase";

/**
 * Fetches the highest stop_minutes value across all time_logs for a specific account.
 */
export const latestGlobalStopFetcher = async ([_key, accountId]) => {
  if (!accountId) return 0;

  const { data, error } = await supabase
    .from("time_logs")
    .select("stop_minutes")
    .eq("account_id", accountId)
    .order("stop_minutes", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data && data.length > 0 && data[0].stop_minutes !== undefined
    ? data[0].stop_minutes
    : 0;
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
