"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";

/**
 * Global SWR and Theme configuration provider.
 *
 * - dedupingInterval: 0
 *   Prevents SWR from silently skipping poll cycles. The default (2000ms)
 *   collides with a 2000ms refreshInterval, causing fetchers to be deduped
 *   as no-ops on consecutive cycles.
 *
 * - refreshWhenHidden: true
 *   Ensures background polling continues when the browser tab loses focus,
 *   critical for side-by-side multi-account testing and real-world usage
 *   where users switch between tabs.
 */
export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <SWRConfig
        value={{
          dedupingInterval: 0,
          refreshWhenHidden: true,
        }}
      >
        <Toaster position="bottom-right" richColors />
        {children}
      </SWRConfig>
    </ThemeProvider>
  );
}
