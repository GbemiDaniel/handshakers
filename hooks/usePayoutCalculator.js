import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";
import { useAccount } from "@/context/AccountContext";

export const preciseRound = (num) => {
  return (Math.round((num + Number.EPSILON) * 1000) / 1000).toFixed(3);
};

export const formatHHMMSS = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  return `${h}:${m.toString().padStart(2, '0')}:00`;
};

/**
 * Converts raw total minutes into an HH:MM string for input display.
 * (e.g. 980 -> "16:20", 0 -> "00:00")
 */
export function minutesToHHMMString(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes <= 0) return "00:00";
  const rounded = Math.round(totalMinutes);
  let hours = Math.floor(rounded / 60);
  let minutes = rounded % 60;

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes}`;
}

/**
 * Converts raw total minutes into a clean "Xh Ym" string for breakdown display.
 * (e.g. 980 -> "16h 20m")
 */
export function minutesToHHMMDisplay(totalMinutes) {
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
 * Converts an HH:MM string into raw Total Minutes.
 * (e.g. "40:00" -> 2400)
 */
export function timeToTotalMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
  const match = /^(\d+):([0-5]?\d)$/.exec(trimmed);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

export const fetchTeamData = async (accountId) => {
  let logsQuery = supabase.from("time_logs").select("id, user_id, start_minutes, stop_minutes, created_at, is_end_of_day");
  let membersQuery = supabase.from("account_members").select("user_id, status");
  
  if (accountId) {
    logsQuery = logsQuery.eq("account_id", accountId);
    membersQuery = membersQuery.eq("account_id", accountId);
  }

  const [
    { data: profiles }, 
    { data: logs },
    { data: members }
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role"),
    logsQuery,
    membersQuery
  ]);

  return { 
    profiles: profiles || [], 
    logs: logs || [],
    members: members || []
  };
};

export function usePayoutCalculator({ session }) {
  const { activeAccount } = useAccount();
  const [platformTimeInput, setPlatformTimeInput] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [payCycle, setPayCycle] = useState('previous');
  const [hasPreviousData, setHasPreviousData] = useState(true);

  const currentUserId = session?.user?.id;
  const activeAccountId = activeAccount?.id;

  const { data, isLoading, mutate } = useSWR(
    ["calculator-team-data", activeAccountId],
    () => fetchTeamData(activeAccountId),
    { refreshInterval: 2000 }
  );

  const { pacificMidnightUTC, pacificNoonUTC, dateLabels } = useMemo(() => {
    const now = new Date();
    
    const laFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const laLocal = new Date(laFormatter.format(now));
    
    const day = laLocal.getDay();
    const diff = laLocal.getDate() - day + (day === 0 ? -6 : 1);
    
    const y = laLocal.getFullYear();
    const m = laLocal.getMonth();
    const d = diff;
    
    const approximateEpoch = Date.UTC(y, m, d, 8, 0, 0, 0);
    
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'shortOffset'
    });
    
    const parts = offsetFormatter.formatToParts(new Date(approximateEpoch));
    const offsetStr = parts.find(p => p.type === 'timeZoneName').value;
    
    let offsetHours = -8;
    const match = offsetStr.match(/GMT([+-]\d+)/);
    if (match) {
      offsetHours = parseInt(match[1], 10);
    }
    
    const midnightEpoch = Date.UTC(y, m, d, 0, 0, 0, 0) - (offsetHours * 60 * 60 * 1000);
    const noonEpoch = midnightEpoch + (12 * 60 * 60 * 1000);
    
    const currentStart = new Date(midnightEpoch);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    
    const currentWeekEnd = new Date(currentStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    
    const previousWeekEnd = new Date(previousStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
    
    const formatDate = (dateObj) => dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const labels = {
      current: `${formatDate(currentStart)} - ${formatDate(currentWeekEnd)}`,
      previous: `${formatDate(previousStart)} - ${formatDate(previousWeekEnd)}`
    };

    return {
      pacificMidnightUTC: midnightEpoch,
      pacificNoonUTC: noonEpoch,
      dateLabels: labels
    };
  }, []);

  useEffect(() => {
    if (!data?.logs) return;
    const previousWeekStart = pacificMidnightUTC - (7 * 24 * 60 * 60 * 1000);
    const hasPrev = data.logs.some(log => {
      const time = new Date(log.created_at).getTime();
      return time >= previousWeekStart && time < pacificMidnightUTC;
    });
    setHasPreviousData(hasPrev);
  }, [data?.logs, pacificMidnightUTC]);

  useEffect(() => {
    if (!hasPreviousData) {
      setPayCycle('current');
    }
  }, [hasPreviousData]);

  const { teamLogs, currentCycleTotalMinutes, remainingMinutes } = useMemo(() => {
    if (!data?.logs) return { teamLogs: [], currentCycleTotalMinutes: 0, remainingMinutes: 4800 };

    const sortedLogs = [...data.logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    let previousCycleLogs = [];
    let currentCycleLogs = [];
    let hasCrossedToCurrent = false;
    let previousLog = null;

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const logTime = new Date(log.created_at).getTime();
      
      if (!hasCrossedToCurrent) {
        let triggerNewCycle = false;
        
        // Condition A (The Hard Cutoff)
        if (logTime >= pacificNoonUTC) {
          triggerNewCycle = true;
        } 
        // Condition B (The Buffer Zone)
        else if (logTime >= pacificMidnightUTC && logTime < pacificNoonUTC) {
          if (previousLog && previousLog.is_end_of_day === true) {
            triggerNewCycle = true;
          } 
          // Condition C (The Zero-Drop Failsafe)
          else if (previousLog && log.start_minutes < previousLog.stop_minutes) {
            triggerNewCycle = true;
          }
        }
        
        if (triggerNewCycle) {
          hasCrossedToCurrent = true;
        }
      }
      
      if (hasCrossedToCurrent) {
        currentCycleLogs.push(log);
      } else {
        previousCycleLogs.push(log);
      }
      
      previousLog = log;
    }

    let currentTotal = 0;
    currentCycleLogs.forEach((log) => {
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) {
        currentTotal += duration;
      }
    });

    let returnedLogs = [];
    if (payCycle === 'current') {
      returnedLogs = currentCycleLogs;
    } else {
      const previousWeekStart = pacificMidnightUTC - (7 * 24 * 60 * 60 * 1000);
      returnedLogs = previousCycleLogs.filter(log => new Date(log.created_at).getTime() >= previousWeekStart);
    }
    
    return {
      teamLogs: returnedLogs,
      currentCycleTotalMinutes: currentTotal,
      remainingMinutes: 4800 - currentTotal
    };
  }, [data?.logs, payCycle, pacificMidnightUTC, pacificNoonUTC]);

  const profilesMap = useMemo(() => {
    if (!data?.profiles) return {};
    const map = {};
    data.profiles.forEach((p) => {
      map[p.id] = p.full_name || `Member (${p.id.slice(0, 6)})`;
    });
    return map;
  }, [data?.profiles]);

  const statusMap = useMemo(() => {
    if (!data?.members) return {};
    const map = {};
    data.members.forEach((m) => {
      map[m.user_id] = m.status;
    });
    return map;
  }, [data?.members]);

  const { teamTotalMinutes, userTotals } = useMemo(() => {
    if (!teamLogs) return { teamTotalMinutes: 0, userTotals: {} };
    const totals = {};
    let totalMins = 0;
    teamLogs.forEach((log) => {
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) {
        totals[log.user_id] = (totals[log.user_id] || 0) + duration;
        totalMins += duration;
      }
    });
    return { teamTotalMinutes: totalMins, userTotals: totals };
  }, [teamLogs]);

  const myTotalMinutes = useMemo(() => {
    if (currentUserId && userTotals[currentUserId]) {
      return userTotals[currentUserId];
    }
    return 0;
  }, [currentUserId, userTotals]);

  const calculatePayout = useCallback((e) => {
    e?.preventDefault();
    setCalculationResult(null);

    const platformMinutes = timeToTotalMinutes(platformTimeInput);

    if (platformMinutes === null) {
      toast.error('Please enter a valid "Platform Paid Time" in HH:MM format (e.g. 40:00).');
      return;
    }

    if (teamTotalMinutes === 0) {
      toast.error("No team logged time found in database. Team members must submit time logs first.");
      return;
    }

    setCalculating(true);

    // Group logs by user to calculate individual time shares & prorated payout
    const userMinutesMap = {};
    teamLogs.forEach((log) => {
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) {
        userMinutesMap[log.user_id] = (userMinutesMap[log.user_id] || 0) + duration;
      }
    });

    // Build breakdown rows for every user who has logged time
    const breakdown = Object.keys(userMinutesMap).map((userId) => {
      const userMinutes = userMinutesMap[userId];
      const shareDecimal = userMinutes / teamTotalMinutes;
      const sharePercentage = preciseRound(shareDecimal * 100);

      // High-precision prorate formula: (User Minutes / Team Total Minutes) * Platform Paid Minutes
      const payoutMinutes = shareDecimal * platformMinutes;
      const payoutDecimalHours = preciseRound(payoutMinutes / 60);
      const userDecimalHours = preciseRound(userMinutes / 60);

      return {
        userId,
        isCurrentUser: userId === currentUserId,
        name: profilesMap[userId] || `User (${userId.slice(0, 6)})`,
        status: statusMap[userId] || 'inactive',
        userMinutes,
        userDecimalHours,
        userHHMM: minutesToHHMMDisplay(userMinutes),
        sharePercentage,
        payoutMinutes,
        payoutDecimalHours,
        payoutHHMM: minutesToHHMMDisplay(payoutMinutes),
      };
    });

    // Sort team members by highest logged minutes
    breakdown.sort((a, b) => b.userMinutes - a.userMinutes);

    const platformDecimalHours = preciseRound(platformMinutes / 60);
    const teamDecimalHours = preciseRound(teamTotalMinutes / 60);

    setCalculationResult({
      platformMinutes,
      platformDecimalHours,
      platformHHMM: minutesToHHMMDisplay(platformMinutes),
      teamTotalMinutes,
      teamDecimalHours,
      teamHHMM: minutesToHHMMDisplay(teamTotalMinutes),
      breakdown,
    });

    setCalculating(false);
  }, [platformTimeInput, teamTotalMinutes, teamLogs, currentUserId, profilesMap, statusMap]);

  return {
    state: {
      platformTimeInput,
      calculating,
      teamLogs,
      profilesMap,
      teamTotalMinutes,
      myTotalMinutes,
      calculationResult,
      isLoading,
      payCycle,
      dateLabels,
      hasPreviousData,
      currentCycleTotalMinutes,
      remainingMinutes,
    },
    setters: {
      setPlatformTimeInput,
      setPayCycle,
      setHasPreviousData,
    },
    actions: {
      calculatePayout,
      mutate,
    },
  };
}
