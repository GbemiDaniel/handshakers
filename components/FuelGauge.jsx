"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Gauge, Sparkles, RefreshCw } from "lucide-react";

/**
 * Converts raw minutes to "Xh Ym" string format.
 * (e.g. 2730 -> "45h 30m", 4800 -> "80h 00m")
 */
function minutesToHHMMDisplay(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes <= 0) return "0h 00m";
  const rounded = Math.round(totalMinutes);
  let hours = Math.floor(rounded / 60);
  let minutes = rounded % 60;

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}h ${formattedMinutes}m`;
}

export default function FuelGauge() {
  const [consumedMinutes, setConsumedMinutes] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [fetching, setFetching] = useState(true);

  const MAX_POOL_MINUTES = 4800; // 80 hours strictly

  const fetchPoolUsage = useCallback(async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("time_logs")
        .select("stop_minutes")
        .order("stop_minutes", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching pool usage for FuelGauge:", error.message);
      }

      if (data && data.length > 0 && data[0].stop_minutes !== undefined) {
        const highestStop = data[0].stop_minutes;
        setConsumedMinutes(highestStop);
      } else {
        setConsumedMinutes(0);
      }
    } catch (err) {
      console.error("Unexpected error fetching pool usage:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPoolUsage();
  }, [fetchPoolUsage]);

  // Trigger smooth transition animation on mount or data fetch
  useEffect(() => {
    const rawPercent = (consumedMinutes / MAX_POOL_MINUTES) * 100;
    const cappedPercent = Math.min(Math.max(rawPercent, 0), 100);

    // Timeout to allow DOM mount before setting width for CSS transition
    const timer = setTimeout(() => {
      setAnimatedPercent(cappedPercent);
    }, 100);

    return () => clearTimeout(timer);
  }, [consumedMinutes]);

  // Dynamic Color Logic
  // < 90%: blue-600
  // >= 90% and < 100%: amber-500
  // >= 100%: red-500
  let fillColorClass = "bg-blue-600";
  let badgeColorClass = "bg-blue-50 border-blue-100 text-blue-600";

  if (consumedMinutes >= 4800) {
    fillColorClass = "bg-red-500";
    badgeColorClass = "bg-red-50 border-red-200 text-red-700";
  } else if (consumedMinutes >= 4320) {
    fillColorClass = "bg-amber-500";
    badgeColorClass = "bg-amber-50 border-amber-200 text-amber-700";
  }

  const rawPercent = ((consumedMinutes / MAX_POOL_MINUTES) * 100).toFixed(1);

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Current Platform Pool Usage
          </span>
          <button
            type="button"
            onClick={fetchPoolUsage}
            disabled={fetching}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100 disabled:opacity-50 ml-1"
            title="Refresh Pool Meter"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badgeColorClass}`}>
            <Sparkles className="w-3 h-3" />
            {rawPercent}%
          </span>
          <span className="text-xs font-semibold text-slate-900 font-mono">
            {minutesToHHMMDisplay(consumedMinutes)} / 80h 00m Used
          </span>
        </div>
      </div>

      {/* Progress Track & Fill Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${fillColorClass}`}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
    </div>
  );
}
