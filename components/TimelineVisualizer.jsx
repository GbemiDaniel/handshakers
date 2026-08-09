"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import BaseCard from "./BaseCard";
import { Clock, Users, Info } from "lucide-react";
import { getUserColorClass, getUserColorTheme } from "@/utils/colorUtils";

/**
 * Format total raw minutes into clean "Xh Ym" string.
 */
function formatDuration(totalMins) {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins) || totalMins <= 0) return "0h 00m";
  const rounded = Math.round(totalMins);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}h ${formattedMinutes}m`;
}

/**
 * Format raw minute offset (e.g. 540) into clock time HH:MM (e.g. "09:00").
 */
function formatClockTime(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return "--:--";
  const rounded = Math.round(mins);
  const hours = Math.floor(rounded / 60) % 24;
  const minutes = rounded % 60;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes}`;
}

export default function TimelineVisualizer({
  logs = [],
  profilesMap = {},
  totalMinutes = 0,
}) {
  const [hoveredLog, setHoveredLog] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Calculate dynamic scale bounds
  const maxScaleMinutes = useMemo(() => {
    if (totalMinutes && totalMinutes > 0) return totalMinutes;
    if (!logs || logs.length === 0) return 0;
    const maxStop = Math.max(...logs.map((l) => l.stop_minutes || 0));
    return maxStop > 0 ? maxStop : 1440; // Default to 24h (1440m) if empty
  }, [totalMinutes, logs]);

  // Filter & process valid time logs
  const validLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        log &&
        typeof log.start_minutes === "number" &&
        typeof log.stop_minutes === "number" &&
        log.stop_minutes > log.start_minutes
    );
  }, [logs]);

  // Aggregate stats per user for the legend breakdown
  const userLegendData = useMemo(() => {
    const userMap = {};

    validLogs.forEach((log) => {
      const duration = log.stop_minutes - log.start_minutes;
      if (!userMap[log.user_id]) {
        userMap[log.user_id] = {
          userId: log.user_id,
          name: profilesMap[log.user_id] || `User (${log.user_id.slice(0, 6)})`,
          totalDuration: 0,
          colorClass: getUserColorClass(log.user_id),
          theme: getUserColorTheme(log.user_id),
        };
      }
      userMap[log.user_id].totalDuration += duration;
    });

    return Object.values(userMap).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [validLogs, profilesMap]);

  // Update tooltip position based on element rect
  const updateTooltipPosition = (elementRect) => {
    setTooltipPos({
      x: elementRect.left + elementRect.width / 2,
      y: elementRect.top,
    });
  };

  const handleMouseEnter = (log, e) => {
    updateTooltipPosition(e.currentTarget.getBoundingClientRect());
    setHoveredLog(log);
  };

  const handleMouseLeave = () => {
    setHoveredLog(null);
  };

  // Touch & Click toggle handler for mobile accessibility
  const handleSegmentClick = (log, e) => {
    e.stopPropagation();
    if (hoveredLog?.id === log.id) {
      setHoveredLog(null);
    } else {
      updateTooltipPosition(e.currentTarget.getBoundingClientRect());
      setHoveredLog(log);
    }
  };

  // Close tooltip on outside click or scroll
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setHoveredLog(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("scroll", handleOutsideClick, { passive: true });
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("scroll", handleOutsideClick);
    };
  }, []);

  return (
    <BaseCard
      title="Team Time Log Timeline"
      subtitle="Visual breakdown of individual time logs across the total timeline"
      headerAction={
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Max Duration: {formatDuration(maxScaleMinutes)}</span>
        </div>
      }
    >
      <div ref={containerRef} className="space-y-6">
        {/* Main Timeline Bar Container */}
        <div className="relative pt-2 pb-1">
          {/* Background Track Bar */}
          <div className="relative h-10 w-full bg-slate-100/90 dark:bg-slate-900/50! border border-slate-200/80 dark:border-slate-800! rounded-2xl overflow-hidden shadow-inner flex items-center">
            {validLogs.length === 0 ? (
              <div className="w-full text-center text-xs font-medium text-slate-400 select-none flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>No active time logs to visualize</span>
              </div>
            ) : (
              validLogs.map((log, index) => {
                const duration = log.stop_minutes - log.start_minutes;
                const widthPct = (duration / maxScaleMinutes) * 100;
                const leftPct = (log.start_minutes / maxScaleMinutes) * 100;
                const colorBgClass = getUserColorClass(log.user_id);
                const theme = getUserColorTheme(log.user_id);
                const userName = profilesMap[log.user_id] || `User (${log.user_id.slice(0, 6)})`;
                const isHovered = hoveredLog?.id === log.id;

                return (
                  <div
                    key={log.id || index}
                    tabIndex={0}
                    onClick={(e) => handleSegmentClick(log, e)}
                    onMouseEnter={(e) => handleMouseEnter(log, e)}
                    onMouseLeave={handleMouseLeave}
                    onFocus={(e) => handleMouseEnter(log, e)}
                    onBlur={handleMouseLeave}
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 0.5)}%`,
                      minWidth: "4px",
                    }}
                    className={`absolute top-1 bottom-1 rounded-lg cursor-pointer min-w-1 transition-all duration-200 ease-in-out outline-none border border-white dark:border-[#0f172a]! focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${colorBgClass} ${theme.hoverBg} ${
                      isHovered
                        ? "ring-2 ring-white dark:ring-[#0f172a]! ring-offset-2 ring-offset-blue-600 scale-y-110 z-20 shadow-md"
                        : "z-10 opacity-90 hover:opacity-100"
                    }`}
                    aria-label={`Time log segment for ${userName}`}
                  />
                );
              })
            )}
          </div>

          {/* Scale Axis Markers (0%, 25%, 50%, 75%, 100%) */}
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase select-none px-0.5 font-mono tabular-nums">
            <span>0m</span>
            <span>{formatDuration(maxScaleMinutes * 0.25)}</span>
            <span>{formatDuration(maxScaleMinutes * 0.5)}</span>
            <span>{formatDuration(maxScaleMinutes * 0.75)}</span>
            <span>{formatDuration(maxScaleMinutes)}</span>
          </div>
        </div>

        {/* Hover / Touch Tooltip (Fixed Overlay) */}
        {hoveredLog && (
          <div
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
            }}
            className="fixed -translate-x-1/2 -translate-y-full z-50 pointer-events-none transition-all duration-200 ease-in-out animate-in fade-in zoom-in-95"
          >
            <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 dark:border-slate-700 space-y-1.5 min-w-50">
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 pb-1.5">
                <span className="font-semibold text-slate-100 truncate">
                  {profilesMap[hoveredLog.user_id] || `User (${hoveredLog.user_id.slice(0, 6)})`}
                </span>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/50 font-mono tabular-nums">
                  {(((hoveredLog.stop_minutes - hoveredLog.start_minutes) / maxScaleMinutes) * 100).toFixed(1)}% Share
                </span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-medium text-white font-mono tabular-nums">
                    {formatDuration(hoveredLog.stop_minutes - hoveredLog.start_minutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Time Range:</span>
                  <span className="font-medium text-white font-mono tabular-nums">
                    {formatClockTime(hoveredLog.start_minutes)} – {formatClockTime(hoveredLog.stop_minutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pt-0.5 font-mono tabular-nums">
                  <span>Raw Minutes:</span>
                  <span>
                    {hoveredLog.start_minutes}m → {hoveredLog.stop_minutes}m
                  </span>
                </div>
              </div>
            </div>
            {/* Tooltip Arrow */}
            <div className="w-2.5 h-2.5 bg-slate-900/95 dark:bg-slate-950/95 rotate-45 mx-auto -mt-1.5 border-r border-b border-slate-800 dark:border-slate-700" />
          </div>
        )}

        {/* Clean Team Members Legend (Responsive Flex-Wrap for Mobile) */}
        {userLegendData.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>Team Member Legend</span>
            </div>
            {/* Flex Wrap Container for Mobile Viewports */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-full">
              {userLegendData.map((item) => {
                const sharePct = maxScaleMinutes > 0 ? ((item.totalDuration / maxScaleMinutes) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={item.userId}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium max-w-full min-w-0 transition-all duration-200 ease-in-out dark:bg-slate-800/30! dark:border-slate-700! dark:text-slate-300! ${item.theme.badgeBg}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${item.colorClass} ${item.theme.shadow} shadow-xs shrink-0`} />
                    <span className={`font-semibold truncate min-w-0 max-w-35 sm:max-w-50 ${item.theme.text} dark:text-slate-300!`} title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-400 font-normal font-mono tabular-nums shrink-0">
                      ({formatDuration(item.totalDuration)} • {sharePct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
}
