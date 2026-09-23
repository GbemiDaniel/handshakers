/**
 * Cross-Account Sync Regression Tests
 *
 * These tests verify that the fixes for cross-account real-time sync
 * are correctly implemented and prevent the bug from resurfacing.
 *
 * Bug Summary:
 *   SWR's default dedupingInterval (2000ms) matched the refreshInterval (2000ms),
 *   causing the fetcher to be silently skipped on consecutive poll cycles.
 *   Additionally, TaskLogger and FuelGauge had no cross-account refresh mechanism.
 *
 * Phase 5 Update:
 *   The hook now queries stop_time_seconds directly (the legacy stop_minutes
 *   column was dropped). Test mocks and assertions use raw seconds — no conversion.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import useSWR from "swr";

// ---------------------------------------------------------------------------
// Mock Supabase — chained builder pattern (vi.mock is hoisted by vitest)
// ---------------------------------------------------------------------------
const mockLimit = vi.fn();
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder }));
const mockLte = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  lte: mockLte,
}));

vi.mock("@/utils/supabase", () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_ACCOUNT_ID = "test-account-abc123";
const TEST_USER_ID = "user-owner-1";

const TEST_WORK_DATE = "2026-09-22";

function logRow(stopTimeSeconds, createdAt = new Date().toISOString(), isEndOfDay = false) {
  return {
    stop_time_seconds: stopTimeSeconds,
    created_at: createdAt,
    user_id: TEST_USER_ID,
    is_end_of_day: isEndOfDay,
    work_date: TEST_WORK_DATE,
  };
}

function resetMocks(stopTimeSeconds = 30000) {
  vi.clearAllMocks();
  // Re-build the chain so each mock returns the next step
  // Chain: from -> select -> eq -> order -> limit
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, lte: mockLte });
  mockEq.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue({
    data: stopTimeSeconds !== null ? [logRow(stopTimeSeconds)] : [],
    error: null,
  });
  mockFrom.mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    lte: mockLte,
  });
}

/** Wrapper that provides a fresh SWR cache with our production config */
function createTestWrapper(swrOverrides = {}) {
  return function TestWrapper({ children }) {
    return React.createElement(
      SWRConfig,
      {
        value: {
          dedupingInterval: 0,
          refreshWhenHidden: true,
          provider: () => new Map(), // Isolate cache per test
          ...swrOverrides,
        },
      },
      children
    );
  };
}

// ---------------------------------------------------------------------------
// Test Suite 1: latestGlobalStopFetcher (unit)
// ---------------------------------------------------------------------------
describe("latestGlobalStopFetcher", () => {
  let latestGlobalStopFetcher;

  beforeEach(async () => {
    resetMocks(30000);
    const mod = await import("@/hooks/useLatestGlobalStop");
    latestGlobalStopFetcher = mod.latestGlobalStopFetcher;
  });

  it("returns the newest log's stop_time_seconds directly", async () => {
    // Pass a key array with accountId, matching how SWR invokes the fetcher
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    // Raw seconds from DB — no conversion
    expect(result.stopSeconds).toBe(30000);
  });

  it("reports the newest log's owner, cycle, End of Day flag and workday", async () => {
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(result.latest).toEqual({
      userId: TEST_USER_ID,
      inCurrentCycle: true,
      isEndOfDay: false,
      workDate: TEST_WORK_DATE,
    });
  });

  it("reports when the newest log closed its workday", async () => {
    mockLimit.mockResolvedValueOnce({ data: [logRow(30000, undefined, true)], error: null });
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(result.latest.isEndOfDay).toBe(true);
  });

  it("resets to 0 but still reports the owner when the newest log is from a previous cycle", async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    mockLimit.mockResolvedValueOnce({ data: [logRow(30000, twoWeeksAgo)], error: null });
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(result.stopSeconds).toBe(0);
    expect(result.latest).toMatchObject({ userId: TEST_USER_ID, inCurrentCycle: false });
  });

  it("returns 0 and no entry when no accountId is provided", async () => {
    const result = await latestGlobalStopFetcher();
    expect(result).toEqual({ stopSeconds: 0, latest: null });
  });

  it("returns 0 and no entry when no time logs exist", async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(result).toEqual({ stopSeconds: 0, latest: null });
  });

  it("returns 0 and no entry when data is null", async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: null });
    const result = await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(result).toEqual({ stopSeconds: 0, latest: null });
  });

  it("throws on Supabase error so SWR can handle retries", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "Database connection failed" },
    });
    await expect(
      latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID])
    ).rejects.toThrow();
  });

  it("queries the time_logs table", async () => {
    await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(mockFrom).toHaveBeenCalledWith("time_logs");
  });

  it("selects the columns the logger and undo button depend on", async () => {
    await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(mockSelect).toHaveBeenCalledWith("stop_time_seconds, created_at, user_id, is_end_of_day, work_date");
  });

  it("filters by account_id", async () => {
    await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(mockEq).toHaveBeenCalledWith("account_id", TEST_ACCOUNT_ID);
  });

  it("orders by created_at descending and limits to 1", async () => {
    await latestGlobalStopFetcher(["latest-global-stop", TEST_ACCOUNT_ID]);
    expect(mockOrder).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(mockLimit).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 2: useLatestGlobalStop hook (integration)
// ---------------------------------------------------------------------------
describe("useLatestGlobalStop hook", () => {
  let useLatestGlobalStop;

  beforeEach(async () => {
    resetMocks(45000);
    const mod = await import("@/hooks/useLatestGlobalStop");
    useLatestGlobalStop = mod.useLatestGlobalStop;
  });

  it("returns fetched data through SWR (in seconds)", async () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => useLatestGlobalStop(TEST_ACCOUNT_ID), { wrapper });

    await waitFor(() => {
      // Raw seconds from DB — no conversion
      expect(result.current.data?.stopSeconds).toBe(45000);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("falls back to a 0 start time before data loads", () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(
      () => useLatestGlobalStop(TEST_ACCOUNT_ID).data?.stopSeconds ?? 0,
      { wrapper }
    );

    // On first synchronous render, before fetch resolves (mirrors TaskLogger)
    expect(result.current).toBe(0);
  });

  it("exposes a mutate function for immediate cache updates", async () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => useLatestGlobalStop(TEST_ACCOUNT_ID), { wrapper });

    await waitFor(() => expect(result.current.data?.stopSeconds).toBe(45000));

    // Optimistic update (simulates the collision handler in TaskLogger)
    const collided = { stopSeconds: 59940, latest: { userId: "someone-else", inCurrentCycle: true } };
    await act(async () => {
      await result.current.mutate(collided, { revalidate: false });
    });

    expect(result.current.data).toEqual(collided);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 3: SWR Polling with dedupingInterval: 0
// ---------------------------------------------------------------------------
describe("SWR Polling: dedupingInterval fix", () => {
  it("FIX: fetcher is invoked on every poll with dedupingInterval: 0", async () => {
    const fetcher = vi.fn().mockResolvedValue(42);
    const wrapper = createTestWrapper({ dedupingInterval: 0 });

    renderHook(
      () => useSWR("poll-fix-test", fetcher, { refreshInterval: 500 }),
      { wrapper }
    );

    // Initial fetch
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // Wait for at least 2 more poll cycles (500ms each + buffer)
    await waitFor(
      () => {
        expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3);
      },
      { timeout: 3000 }
    );
  }, 5000);

  it("FIX: data updates are picked up across poll cycles", async () => {
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      return Promise.resolve(callCount * 100);
    });

    const wrapper = createTestWrapper({ dedupingInterval: 0 });

    const { result } = renderHook(
      () => useSWR("poll-data-test", fetcher, { refreshInterval: 500 }),
      { wrapper }
    );

    // Initial value
    await waitFor(() => expect(result.current.data).toBe(100));

    // After polling, value should increase (proves fetcher re-fired)
    await waitFor(
      () => {
        expect(result.current.data).toBeGreaterThan(100);
      },
      { timeout: 3000 }
    );
  }, 5000);
});

// ---------------------------------------------------------------------------
// Test Suite 4: DailyLogs fetcher — no cacheBustTime (.lte filter removed)
// ---------------------------------------------------------------------------
describe("DailyLogs fetcher: cacheBustTime removal", () => {
  it("time_logs query does NOT use .lte() filter (regression guard)", async () => {
    // Read the DailyLogs source file and verify .lte is not chained
    // onto the time_logs query. This is a static analysis test.
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.default.resolve("components/DailyLogs.jsx");
    const source = fs.default.readFileSync(filePath, "utf-8");

    // Extract the fetcher function body (supports destructured args)
    const fetcherMatch = source.match(
      /const fetcher\s*=\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\};/
    );
    expect(fetcherMatch).not.toBeNull();

    const fetcherBody = fetcherMatch[1];

    // Verify .lte() is NOT called in the fetcher
    expect(fetcherBody).not.toContain(".lte(");

    // Verify cacheBustTime variable is NOT present
    expect(fetcherBody).not.toContain("cacheBustTime");
  });
});

// ---------------------------------------------------------------------------
// Test Suite 5: Providers component — global SWR config validation
// ---------------------------------------------------------------------------
describe("Providers: Global SWR Config", () => {
  it("configures dedupingInterval: 0 (verified via source)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.default.resolve("app/providers.jsx");
    const source = fs.default.readFileSync(filePath, "utf-8");

    expect(source).toContain("dedupingInterval: 0");
    expect(source).toContain("refreshWhenHidden: true");
  });

  it("is imported and used in layout.jsx", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.default.resolve("app/layout.jsx");
    const source = fs.default.readFileSync(filePath, "utf-8");

    expect(source).toContain('import Providers from "./providers"');
    expect(source).toContain("<Providers>");
  });
});

// ---------------------------------------------------------------------------
// Test Suite 6: Shared SWR key — TaskLogger + FuelGauge sync
// ---------------------------------------------------------------------------
describe("Shared SWR key: TaskLogger + FuelGauge cross-component sync", () => {
  it("hook defines the shared SWR cache key 'latest-global-stop'", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const hookSource = fs.default.readFileSync(
      path.default.resolve("hooks/useLatestGlobalStop.js"),
      "utf-8"
    );
    const taskLoggerSource = fs.default.readFileSync(
      path.default.resolve("components/TaskLogger.jsx"),
      "utf-8"
    );

    // The hook defines the key
    expect(hookSource).toContain('"latest-global-stop"');

    // TaskLogger imports and uses the shared hook
    expect(taskLoggerSource).toContain("useLatestGlobalStop");
  });

  it("TaskLogger no longer uses one-shot fetchLatestGlobalTime", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.default.readFileSync(
      path.default.resolve("components/TaskLogger.jsx"),
      "utf-8"
    );

    // The old one-shot fetch pattern should be completely removed
    expect(source).not.toContain("fetchLatestGlobalTime");
    expect(source).not.toContain("setLockedStartMinutes");
    expect(source).not.toContain("setFetchingLatest");
  });

  it("FuelGauge no longer uses one-shot fetchPoolUsage", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.default.readFileSync(
      path.default.resolve("components/FuelGauge.jsx"),
      "utf-8"
    );

    // The old one-shot fetch pattern should be completely removed
    expect(source).not.toContain("fetchPoolUsage");
    expect(source).not.toContain("setConsumedMinutes");
    expect(source).not.toContain("setFetching");
    expect(source).not.toContain("refreshKey");
  });
});
