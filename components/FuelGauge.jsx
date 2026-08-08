"use client";

import React, { useState, useEffect } from "react";
import { usePayoutCalculator } from "@/hooks/usePayoutCalculator";
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
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const MAX_POOL_MINUTES = 4800; // 80 hours strictly

  const { state, actions } = usePayoutCalculator({});
  const { currentCycleTotalMinutes = 0, isLoading: fetching } = state;
  const { mutate: refreshPool } = actions;

  // Trigger smooth transition animation on mount or data fetch
  useEffect(() => {
    const rawPercent = (currentCycleTotalMinutes / MAX_POOL_MINUTES) * 100;
    const cappedPercent = Math.min(Math.max(rawPercent, 0), 100);

    const timer = setTimeout(() => {
      setAnimatedPercent(cappedPercent);
    }, 50);

    return () => clearTimeout(timer);
  }, [currentCycleTotalMinutes]);

  // Dynamic Color Logic
  let fillColorClass = "bg-blue-600";
  let badgeColorClass = "bg-blue-50 border-blue-100 text-blue-600";
  let glowBorderClass = "border-slate-200/80";

  if (currentCycleTotalMinutes >= 4800) {
    fillColorClass = "bg-red-500";
    badgeColorClass = "bg-red-50 border-red-200 text-red-700";
    glowBorderClass = "border-red-300 ring-2 ring-red-100";
  } else if (currentCycleTotalMinutes >= 4320) {
    fillColorClass = "bg-amber-500";
    badgeColorClass = "bg-amber-50 border-amber-200 text-amber-700";
    glowBorderClass = "border-amber-300 ring-2 ring-amber-100";
  }

  const rawPercent = ((currentCycleTotalMinutes / MAX_POOL_MINUTES) * 100).toFixed(1);

  return (
    <div className={`@container w-full bg-white border ${glowBorderClass} rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            Current Platform Pool Usage
          </span>
          <button
            type="button"
            onClick={() => refreshPool()}
            disabled={fetching}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] p-1 rounded-lg hover:bg-slate-100 disabled:opacity-50 ml-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Refresh Pool Meter"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold tabular-nums ${badgeColorClass}`}>
            <Sparkles className="w-3 h-3" />
            {rawPercent}%
          </span>
          <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
            {minutesToHHMMDisplay(currentCycleTotalMinutes)} / 80h 00m Used
          </span>
        </div>
      </div>

      {/* Progress Track & Fill Bar */}
      <div className="w-full bg-slate-100/90 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${fillColorClass}`}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
    </div>
  );
}
