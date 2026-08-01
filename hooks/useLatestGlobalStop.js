import useSWR from "swr";
import { supabase } from "@/utils/supabase";

/**
 * Fetches the highest stop_minutes value across all time_logs.
 * This represents the current position of the team relay timeline.
 *
 * Exported for direct testing.
 */
export const latestGlobalStopFetcher = async () => {
  const { data, error } = await supabase
    .from("time_logs")
    .select("stop_minutes")
    .order("stop_minutes", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data && data.length > 0 && data[0].stop_minutes !== undefined
    ? data[0].stop_minutes
    : 0;
};

/**
 * Shared SWR hook for the latest global stop time.
 *
 * Used by both TaskLogger (for the locked start time) and FuelGauge
 * (for pool usage). Because both use the same SWR cache key
 * ("latest-global-stop"), when one component mutates, the other
 * automatically receives the updated value — zero prop-drilling needed.
 *
 * Global config (dedupingInterval, refreshWhenHidden) is inherited
 * from the <SWRConfig> provider in app/providers.jsx.
 */
export function useLatestGlobalStop() {
  return useSWR("latest-global-stop", latestGlobalStopFetcher, {
    refreshInterval: 2000,
  });
}
