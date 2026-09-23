import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";
import { useAccount } from "@/context/AccountContext";
import { useAdminStore } from "@/store/useAdminStore";
import { timeToTotalSeconds, secondsToHHMMString, secondsToHHMMSSString, getCurrentCycleBoundaries } from "@/utils/timeUtils";

export const preciseRound = (num) => {
  return (Math.round((num + Number.EPSILON) * 1000) / 1000).toFixed(3);
};

export const formatHHMMSS = (totalSecs) => {
  return secondsToHHMMSSString(totalSecs);
};

/**
 * Converts raw total seconds into an HH:MM string for input display.
 * Retains the name for backward API compatibility but operates on seconds.
 */
export function minutesToHHMMString(totalSeconds) {
  return secondsToHHMMString(totalSeconds);
}

/**
 * Converts raw total seconds into a clean "Xh Ym Zs" string for breakdown display.
 * Retains the name for backward API compatibility but operates on seconds.
 */
export function minutesToHHMMDisplay(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds <= 0) return "0h 00m";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  
  if (seconds > 0) {
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${hours}h ${formattedMinutes}m ${formattedSeconds}s`;
  }
  
  return `${hours}h ${formattedMinutes}m`;
}

/**
 * Converts an HH:MM string into raw Total Seconds.
 * Retains the name for backward API compatibility.
 */
export function timeToTotalMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const secs = timeToTotalSeconds(timeStr);
  return secs === 0 && timeStr.trim() !== "00:00" ? null : secs;
}

export const fetchTeamData = async (accountId) => {
  let logsQuery = supabase.from("time_logs").select("id, user_id, start_time_seconds, stop_time_seconds, created_at, is_end_of_day, work_date");
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

export function usePayoutCalculator({ session } = {}) {
  const { activeAccount: contextAccount } = useAccount();
  const activeAccount = useAdminStore(state => 
    state.workspaces.find(w => w.id === contextAccount?.id)
  ) || contextAccount;
  const poolLimitHours = activeAccount?.weekly_pool_hours ?? 0;
  const maxPoolSeconds = poolLimitHours * 3600;

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

  // Delegate cycle boundary math to the shared utility (single source of truth)
  const { pacificMidnightUTC, pacificNoonUTC, dateLabels } = useMemo(() => {
    return getCurrentCycleBoundaries();
  }, []);

  useEffect(() => {
    if (!data?.logs) return;
    const previousWeekStart = pacificMidnightUTC - (7 * 24 * 60 * 60 * 1000);
    const hasPrev = data.logs.some(log => {
      const time = new Date(log.created_at).getTime();
      return time >= previousWeekStart && time < pacificMidnightUTC;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasPreviousData(hasPrev);
  }, [data?.logs, pacificMidnightUTC]);

  useEffect(() => {
    if (!hasPreviousData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayCycle('current');
    }
  }, [hasPreviousData]);

    const logs = data?.logs;
    const profiles = data?.profiles;
    const members = data?.members;

    const { teamLogs, currentCycleTotalSeconds, remainingMinutes } = useMemo(() => {
      if (!logs) return { teamLogs: [], currentCycleTotalSeconds: 0, remainingMinutes: maxPoolSeconds };

      const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
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
            else if (previousLog && log.start_time_seconds < previousLog.stop_time_seconds) {
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
        const duration = (log.stop_time_seconds || 0) - (log.start_time_seconds || 0);
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
        currentCycleTotalSeconds: currentTotal,
        remainingMinutes: maxPoolSeconds - currentTotal
      };
    }, [logs, payCycle, pacificMidnightUTC, pacificNoonUTC, maxPoolSeconds]);

    const profilesMap = useMemo(() => {
      if (!profiles) return {};
      const map = {};
      profiles.forEach((p) => {
        map[p.id] = p.full_name || `Member (${p.id.slice(0, 6)})`;
      });
      return map;
    }, [profiles]);

    const statusMap = useMemo(() => {
      if (!members) return {};
      const map = {};
      members.forEach((m) => {
        map[m.user_id] = m.status;
      });
      return map;
    }, [members]);

  const { teamTotalMinutes, userTotals } = useMemo(() => {
    if (!teamLogs) return { teamTotalMinutes: 0, userTotals: {} };
    const totals = {};
    let totalMins = 0;
    teamLogs.forEach((log) => {
      const duration = (log.stop_time_seconds || 0) - (log.start_time_seconds || 0);
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

    if (platformMinutes === null || platformMinutes === 0) {
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
      const duration = (log.stop_time_seconds || 0) - (log.start_time_seconds || 0);
      if (duration > 0) {
        userMinutesMap[log.user_id] = (userMinutesMap[log.user_id] || 0) + duration;
      }
    });

    // Build breakdown rows for every user who has logged time
    const breakdown = Object.keys(userMinutesMap).map((userId) => {
      const userMinutes = userMinutesMap[userId];
      const shareDecimal = userMinutes / teamTotalMinutes;
      const sharePercentage = preciseRound(shareDecimal * 100);

      // High-precision prorate formula: (User Seconds / Team Total Seconds) * Platform Paid Seconds
      const payoutMinutes = shareDecimal * platformMinutes;
      const payoutDecimalHours = preciseRound(payoutMinutes / 3600);
      const userDecimalHours = preciseRound(userMinutes / 3600);

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

    // Sort team members by highest logged time
    breakdown.sort((a, b) => b.userMinutes - a.userMinutes);

    const platformDecimalHours = preciseRound(platformMinutes / 3600);
    const teamDecimalHours = preciseRound(teamTotalMinutes / 3600);

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
      currentCycleTotalSeconds,
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
