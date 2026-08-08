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
  let logsQuery = supabase.from("time_logs").select("id, user_id, start_minutes, stop_minutes, created_at");
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

  const currentUserId = session?.user?.id;
  const activeAccountId = activeAccount?.id;

  const { data, isLoading, mutate } = useSWR(
    ["calculator-team-data", activeAccountId],
    () => fetchTeamData(activeAccountId),
    { refreshInterval: 2000 }
  );

  const teamLogs = useMemo(() => data?.logs || [], [data?.logs]);

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
    if (!data?.logs) return { teamTotalMinutes: 0, userTotals: {} };
    const totals = {};
    let totalMins = 0;
    data.logs.forEach((log) => {
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) {
        totals[log.user_id] = (totals[log.user_id] || 0) + duration;
        totalMins += duration;
      }
    });
    return { teamTotalMinutes: totalMins, userTotals: totals };
  }, [data?.logs]);

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
    },
    setters: {
      setPlatformTimeInput,
    },
    actions: {
      calculatePayout,
      mutate,
    },
  };
}
