"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/utils/supabase";
import { useAccount } from "@/context/AccountContext";
import { Calendar, RefreshCw, ChevronRight, ChevronDown, Clock, User, CalendarDays } from "lucide-react";
import { secondsToSmartDisplay, secondsToHHMMSSString, formatWorkDate, todayInTeamZone } from "@/utils/timeUtils";
import TelemetrySync from "@/components/TelemetrySync";
import ChangeWorkdayDateModal from "@/components/ChangeWorkdayDateModal";

const getWeekBoundaries = () => {
  const now = new Date();
  const startOfCurrentWeek = new Date(now);
  
  const day = startOfCurrentWeek.getUTCDay();
  // Calculate difference to last Monday
  const diff = startOfCurrentWeek.getUTCDate() - day + (day === 0 ? -6 : 1);
  
  startOfCurrentWeek.setUTCDate(diff);
  startOfCurrentWeek.setUTCHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfCurrentWeek);
  startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);

  return { startOfCurrentWeek, startOfLastWeek };
};

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
    const duration = (log.stop_time_seconds || 0) - (log.start_time_seconds || 0);
    if (duration <= 0) continue;

    // Check for zero-drop failsafe: split if odometer resets
    if (currentShift && currentShift.sessions.length > 0) {
      const previousLog = currentShift.sessions[currentShift.sessions.length - 1];
      const isZeroDrop = log.start_time_seconds < previousLog.stopSeconds;
      if (isZeroDrop) {
        shifts.push(currentShift);
        currentShift = null;
      }
    }

    // Initialize a new shift if currentShift is null
    if (!currentShift) {
      currentShift = {
        shiftId: log.id,
        anchorIso: log.created_at,
        // work_date, not created_at: a day typed in after midnight still
        // belongs to the day it was worked.
        shiftDateTitle: formatWorkDate(log.work_date),
        workDate: log.work_date,
        dailyTotalSeconds: 0,
        sessions: [],
      };
    }

    // Build the session object with user attribution
    const userName = profilesMap[log.user_id] || `User (${log.user_id?.slice(0, 6)})`;
    const isCurrentUser = log.user_id === currentUserId;

    currentShift.dailyTotalSeconds += duration;
    currentShift.sessions.push({
      id: log.id,
      userId: log.user_id,
      userName,
      isCurrentUser,
      startSeconds: log.start_time_seconds,
      stopSeconds: log.stop_time_seconds,
      isEndOfDay: !!log.is_end_of_day,
      durationSeconds: duration,
      startClock: secondsToHHMMSSString(log.start_time_seconds),
      stopClock: secondsToHHMMSSString(log.stop_time_seconds),
      durationHHMM: secondsToSmartDisplay(duration),
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
const fetcher = async ([_key, accountId]) => {
  if (!accountId) return { logs: [], profMap: {} };

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

  // 2. Fetch ALL team logs for this account
  const { data: logs, error: logsErr } = await supabase
    .from("time_logs")
    .select("id, user_id, start_time_seconds, stop_time_seconds, is_end_of_day, created_at, work_date")
    .eq("account_id", accountId)
    .order("created_at", { ascending: true });

  if (logsErr) throw logsErr;

  return { logs: logs || [], profMap };
};

export default function DailyLogs({ session, refreshKey }) {
  const [expandedShiftKeys, setExpandedShiftKeys] = useState({});
  const [dateEditor, setDateEditor] = useState(null);
  const { activeAccount, canManageAccount } = useAccount();
  const canChangeDates = canManageAccount(activeAccount?.id);

  const currentUserId = session?.user?.id;

  // Initialize SWR for data fetching and caching
  // Global SWRConfig provides dedupingInterval: 0 and refreshWhenHidden: true
  const { data, isLoading, mutate } = useSWR(
    activeAccount?.id ? ["master-relay-timeline", activeAccount.id] : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  // Derive the grouped shifts cleanly from the cached SWR data
  const groupedShifts = React.useMemo(() => {
    if (!data || !data.logs || data.logs.length === 0) return [];
    const shifts = groupLogsIntoShifts(data.logs, data.profMap, currentUserId);
    // The dates an admin may move each day to: no earlier than the day before
    // it, no later than the day after it or today (set_workday_date's rules).
    const today = todayInTeamZone();
    shifts.forEach((shift, i) => {
      const next = shifts[i + 1]?.workDate;
      shift.minDate = shifts[i - 1]?.workDate ?? null;
      shift.maxDate = next && next < today ? next : today;
    });
    // Reverse so the most recent shift appears at the top
    return [...shifts].reverse();
  }, [data, currentUserId]);

  const categorizedShifts = React.useMemo(() => {
    const { startOfCurrentWeek, startOfLastWeek } = getWeekBoundaries();
    const currentWeekTime = startOfCurrentWeek.getTime();
    const lastWeekTime = startOfLastWeek.getTime();

    return groupedShifts.reduce(
      (acc, shift) => {
        // Grab the timestamp of the first session in the shift
        const firstSession = shift.sessions[0];

        // Fallback through possible timestamp keys (Supabase default vs camelCase vs custom)
        const rawDate = firstSession?.created_at || firstSession?.createdAt || firstSession?.timestamp || firstSession?.startTime;

        const shiftTime = rawDate ? new Date(rawDate).getTime() : 0;

        // FAILSAFE: If we still can't parse it, keep it visible in currentWeek
        if (!shiftTime || isNaN(shiftTime)) {
          acc.currentWeek.push(shift);
          return acc;
        }

        if (shiftTime >= currentWeekTime) {
          acc.currentWeek.push(shift);
        } else if (shiftTime >= lastWeekTime && shiftTime < currentWeekTime) {
          acc.lastWeek.push(shift);
        } else {
          acc.older.push(shift);
        }
        return acc;
      },
      { currentWeek: [], lastWeek: [], older: [] }
    );
  }, [groupedShifts]);

  const renderShift = (shift) => {
    const isExpanded = !!expandedShiftKeys[shift.shiftId];
    return (
      <div key={shift.shiftId} className="w-full">
        {/* Top Level Accordion Trigger */}
        <button
          type="button"
          onClick={() => toggleAccordion(shift.shiftId)}
          className={`w-full flex items-center justify-between py-3 px-3.5 rounded-xl border text-left transition-all duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isExpanded
              ? "bg-slate-50/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 rounded-b-none"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 hover:border-slate-300/80 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-xs font-medium min-w-0">
            <div className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ease-in-out ${isExpanded ? "rotate-90 text-blue-600 dark:text-blue-400" : ""}`}>
              <ChevronRight className="w-4 h-4" />
            </div>
            {/* Anchor Date Title */}
            <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {shift.shiftDateTitle}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal shrink-0 tabular-nums">
              ({shift.sessions.length} {shift.sessions.length === 1 ? "shift" : "shifts"})
            </span>
          </div>

          <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs tabular-nums shrink-0 pl-2">
            {secondsToSmartDisplay(shift.dailyTotalSeconds)}
          </div>
        </button>

        {/* Sub-Content Panel: Nested List of Individual Sessions */}
        {isExpanded && (
          <div className="bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-b-xl border-x border-b border-slate-200/80 dark:border-slate-800 space-y-2 text-xs animate-in fade-in duration-150 ease-in-out">
            {shift.sessions.map((sess, idx) => (
              <div
                key={sess.id || idx}
                className={`py-2.5 px-3 bg-white dark:bg-slate-900 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs transition-colors duration-150 ${
                  sess.isCurrentUser
                    ? "border-blue-200/80 dark:border-blue-800/80 ring-1 ring-blue-50/80 dark:ring-blue-950/40"
                    : "border-slate-200/70 dark:border-slate-800 hover:border-slate-300/70 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium min-w-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-mono tabular-nums shrink-0">
                    <strong className="text-slate-800 dark:text-slate-200">{sess.startClock}</strong> &ndash; <strong className="text-slate-800 dark:text-slate-200">{sess.stopClock}</strong>
                  </span>
                  {/* User Attribution Badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink min-w-0 ${
                    sess.isCurrentUser
                      ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60"
                      : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700"
                  }`}>
                    <User className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{sess.isCurrentUser ? "You" : sess.userName}</span>
                  </span>
                  {sess.isEndOfDay && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 px-1.5 py-0.5 rounded shrink-0">
                      End of Day
                    </span>
                  )}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px] font-mono tabular-nums shrink-0 pl-5.5 sm:pl-0">
                  {sess.durationHHMM} ({sess.durationSeconds} secs)
                </div>
              </div>
            ))}

            {canChangeDates && (
              <div className="flex justify-end pt-1 border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDateEditor({
                    firstLogId: shift.shiftId,
                    workDate: shift.workDate,
                    minDate: shift.minDate,
                    maxDate: shift.maxDate,
                    entryCount: shift.sessions.length,
                  })}
                  className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Change date
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
    <div className="@container w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-all duration-200 ease-in-out">

      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span>Shared Relay Timeline</span>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150 ease-in-out p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Refresh Shared Relay Timeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Accordion Grouped Shifts List */}
      {isLoading ? (
        <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-2">
          <TelemetrySync />
          <span>Loading shared relay timeline...</span>
        </div>
      ) : groupedShifts.length === 0 ? (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center space-y-1.5">
          <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No time logged in relay shifts yet</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">Use the Snap-On Task Logger above to record your shift start and stop times.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categorizedShifts.currentWeek.map(renderShift)}

          {categorizedShifts.lastWeek.length > 0 && (
            <div className="w-full">
              <button
                type="button"
                onClick={() => toggleAccordion('folder-last-week')}
                className={`w-full flex items-center justify-between py-3 px-3.5 rounded-xl border text-left transition-all duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  expandedShiftKeys['folder-last-week']
                    ? "bg-slate-50/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 rounded-b-none"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 hover:border-slate-300/80 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-xs font-medium min-w-0">
                  <div className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ease-in-out ${expandedShiftKeys['folder-last-week'] ? "rotate-90 text-blue-600 dark:text-blue-400" : ""}`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    Last Week
                  </span>
                </div>
              </button>
              {expandedShiftKeys['folder-last-week'] && (
                <div className="bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-b-xl border-x border-b border-slate-200/80 dark:border-slate-800 space-y-2 animate-in fade-in duration-150 ease-in-out">
                  {categorizedShifts.lastWeek.map(renderShift)}
                </div>
              )}
            </div>
          )}

          {categorizedShifts.older.length > 0 && (
            <div className="w-full">
              <button
                type="button"
                onClick={() => toggleAccordion('folder-older')}
                className={`w-full flex items-center justify-between py-3 px-3.5 rounded-xl border text-left transition-all duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  expandedShiftKeys['folder-older']
                    ? "bg-slate-50/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 rounded-b-none"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 hover:border-slate-300/80 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-xs font-medium min-w-0">
                  <div className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ease-in-out ${expandedShiftKeys['folder-older'] ? "rotate-90 text-blue-600 dark:text-blue-400" : ""}`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    Older Logs
                  </span>
                </div>
              </button>
              {expandedShiftKeys['folder-older'] && (
                <div className="bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-b-xl border-x border-b border-slate-200/80 dark:border-slate-800 space-y-2 animate-in fade-in duration-150 ease-in-out">
                  {categorizedShifts.older.map(renderShift)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {dateEditor && (
        <ChangeWorkdayDateModal
          key={dateEditor.firstLogId}
          day={dateEditor}
          accountId={activeAccount?.id}
          onClose={() => setDateEditor(null)}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
