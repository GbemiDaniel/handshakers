"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/utils/supabase";
import { Calendar, RefreshCw, ChevronRight, ChevronDown, Clock, User } from "lucide-react";

/**
 * Formats ISO timestamp into a full Anchor Date string:
 * "Today", "Yesterday", or "Tuesday, Jul 28"
 */
function formatAnchorDate(isoString) {
  if (!isoString) return "Unknown Date";
  const logDate = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (logDate.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (logDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return logDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Converts raw minutes to HH:MM clock string (e.g. 1215 -> "20:15").
 */
function minutesToClockString(rawMinutes) {
  if (rawMinutes === null || rawMinutes === undefined || isNaN(rawMinutes)) return "00:00";
  const hours = Math.floor(rawMinutes / 60);
  const mins = rawMinutes % 60;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${formattedHours}:${formattedMins}`;
}

/**
 * Converts duration minutes to standard "Xh Ym" format (e.g. 100 -> "1h 40m").
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

/**
 * Sequential Chunking Algorithm:
 * Groups a flat, chronologically sorted array of logs into shift chunks.
 * Splitting is ONLY triggered by the is_end_of_day flag — never by calendar dates.
 */
function groupLogsIntoShifts(logs, profilesMap, currentUserId) {
  const shifts = [];
  let currentShift = null;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
    if (duration <= 0) continue;

    // Initialize a new shift if currentShift is null
    if (!currentShift) {
      currentShift = {
        shiftId: log.id,
        anchorIso: log.created_at,
        shiftDateTitle: formatAnchorDate(log.created_at),
        dailyTotalMinutes: 0,
        sessions: [],
      };
    }

    // Build the session object with user attribution
    const userName = profilesMap[log.user_id] || `User (${log.user_id?.slice(0, 6)})`;
    const isCurrentUser = log.user_id === currentUserId;

    currentShift.dailyTotalMinutes += duration;
    currentShift.sessions.push({
      id: log.id,
      userId: log.user_id,
      userName,
      isCurrentUser,
      startMinutes: log.start_minutes,
      stopMinutes: log.stop_minutes,
      isEndOfDay: !!log.is_end_of_day,
      durationMinutes: duration,
      startClock: minutesToClockString(log.start_minutes),
      stopClock: minutesToClockString(log.stop_minutes),
      durationHHMM: minutesToHHMMDisplay(duration),
      createdAt: log.created_at,
    });

    // THE SPLIT RULE: If this log has is_end_of_day === true,
    // finalize the current shift and start a brand new one.
    if (log.is_end_of_day) {
      shifts.push(currentShift);
      currentShift = null;
    }
  }

  // Push any remaining open shift (no is_end_of_day flag yet)
  if (currentShift && currentShift.sessions.length > 0) {
    shifts.push(currentShift);
  }

  return shifts;
}

// SWR Fetcher: Selects all team profiles and time_logs ordered chronologically
const fetcher = async () => {
  // 1. Fetch ALL team profiles
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (profErr) throw profErr;

  const profMap = {};
  if (profiles) {
    profiles.forEach((p) => {
      profMap[p.id] = p.full_name || `Member (${p.id.slice(0, 6)})`;
    });
  }

  // 2. Fetch ALL team logs
  const { data: logs, error: logsErr } = await supabase
    .from("time_logs")
    .select("id, user_id, start_minutes, stop_minutes, is_end_of_day, created_at")
    .order("created_at", { ascending: true });

  if (logsErr) throw logsErr;

  return { logs: logs || [], profMap };
};

export default function DailyLogs({ session, refreshKey }) {
  const [expandedShiftKeys, setExpandedShiftKeys] = useState({});

  const currentUserId = session?.user?.id;

  // Initialize SWR for data fetching and caching
  // Global SWRConfig provides dedupingInterval: 0 and refreshWhenHidden: true
  const { data, isLoading, mutate } = useSWR("master-relay-timeline", fetcher, {
    refreshInterval: 2000,
  });

  // Derive the grouped shifts cleanly from the cached SWR data
  const groupedShifts = React.useMemo(() => {
    if (!data || !data.logs || data.logs.length === 0) return [];
    const shifts = groupLogsIntoShifts(data.logs, data.profMap, currentUserId);
    // Reverse so the most recent shift appears at the top
    return [...shifts].reverse();
  }, [data, currentUserId]);

  // TRACE 4: Monitor all SWR data state changes
  useEffect(() => {
    console.log("TRACE 4: SWR Data State Changed:", {
      hasData: !!data,
      logCount: data?.logs?.length ?? 0,
      profileCount: data?.profMap ? Object.keys(data.profMap).length : 0,
      latestLog: data?.logs?.length > 0 ? data.logs[data.logs.length - 1] : null,
      fullLogs: data?.logs,
    });
  }, [data]);

  // Sync with global dashboard refresh trigger (e.g. when TaskLogger inserts a new log locally)
  useEffect(() => {
    if (refreshKey > 0) {
      console.log("TRACE 4a: refreshKey triggered mutate(), refreshKey =", refreshKey);
      mutate();
    }
  }, [refreshKey, mutate]);


  const toggleAccordion = (shiftId) => {
    setExpandedShiftKeys((prev) => ({
      ...prev,
      [shiftId]: !prev[shiftId],
    }));
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Shared Relay Timeline</span>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          title="Refresh Shared Relay Timeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Accordion Grouped Shifts List */}
      {isLoading ? (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 text-center text-xs text-slate-400 animate-pulse">
          Loading shared relay timeline...
        </div>
      ) : groupedShifts.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 text-center text-xs text-slate-400">
          No time logged in relay shifts yet.
        </div>
      ) : (
        <div className="space-y-2">
          {groupedShifts.map((shift) => {
            const isExpanded = !!expandedShiftKeys[shift.shiftId];
            return (
              <div key={shift.shiftId} className="w-full">
                {/* Top Level Accordion Trigger */}
                <div
                  onClick={() => toggleAccordion(shift.shiftId)}
                  className={`flex items-center justify-between py-3 px-3.5 rounded-xl border transition-colors cursor-pointer select-none ${
                    isExpanded
                      ? "bg-slate-50 border-slate-300 rounded-b-none"
                      : "bg-white border-slate-200/70 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-slate-700 text-xs font-medium min-w-0">
                    <div className="text-slate-400 transition-transform duration-150">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {/* Anchor Date Title */}
                    <span className="truncate font-semibold text-slate-800">
                      {shift.shiftDateTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0">
                      ({shift.sessions.length} {shift.sessions.length === 1 ? "session" : "sessions"})
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900 font-mono text-xs shrink-0">
                    {minutesToHHMMDisplay(shift.dailyTotalMinutes)}
                  </div>
                </div>

                {/* Sub-Content Panel: Nested List of Individual Sessions */}
                {isExpanded && (
                  <div className="bg-slate-50 p-3 rounded-b-xl border-x border-b border-slate-200/80 space-y-2 text-xs animate-in fade-in duration-150">
                    {shift.sessions.map((sess, idx) => (
                      <div
                        key={sess.id || idx}
                        className={`py-2.5 px-3 bg-white rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs ${
                          sess.isCurrentUser
                            ? "border-blue-200/80 ring-1 ring-blue-50"
                            : "border-slate-200/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-slate-600 font-medium min-w-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-slate-800">{sess.startClock}</strong> &ndash; <strong className="text-slate-800">{sess.stopClock}</strong>
                          </span>
                          {/* User Attribution Badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                            sess.isCurrentUser
                              ? "text-blue-700 bg-blue-50 border border-blue-200/80"
                              : "text-slate-500 bg-slate-100 border border-slate-200/60"
                          }`}>
                            <User className="w-2.5 h-2.5" />
                            {sess.isCurrentUser ? "You" : sess.userName}
                          </span>
                          {sess.isEndOfDay && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded shrink-0">
                              End of Day
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-medium text-[11px] shrink-0 pl-5.5 sm:pl-0">
                          {sess.durationHHMM} ({sess.durationMinutes} mins)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
