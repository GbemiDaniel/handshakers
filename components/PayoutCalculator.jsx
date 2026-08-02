"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { Calculator, Clock, Lock, AlertCircle, Sparkles, RefreshCw, Users, User, Copy, Save, Check } from "lucide-react";

const preciseRound = (num) => {
  return (Math.round((num + Number.EPSILON) * 1000) / 1000).toFixed(3);
};

const formatHHMMSS = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  return `${h}:${m.toString().padStart(2, '0')}:00`;
};

/**
 * Converts raw total minutes into an HH:MM string for input display.
 * (e.g. 980 -> "16:20", 0 -> "00:00")
 */
function minutesToHHMMString(totalMinutes) {
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
 * Converts an HH:MM string into raw Total Minutes.
 * (e.g. "40:00" -> 2400)
 */
function timeToTotalMinutes(timeStr) {
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

const fetchTeamData = async () => {
  const [
    { data: profiles }, 
    { data: logs },
    { data: settings }
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role"),
    supabase.from("time_logs").select("id, user_id, start_minutes, stop_minutes, created_at"),
    supabase.from("team_settings").select("account_name").eq("id", 1).single()
  ]);
  return { 
    profiles: profiles || [], 
    logs: logs || [],
    globalAccountName: settings?.account_name || ""
  };
};

export default function PayoutCalculator({ session }) {
  const [accountName, setAccountName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [platformTimeInput, setPlatformTimeInput] = useState("");
  const [calculating, setCalculating] = useState(false);

  const [teamLogs, setTeamLogs] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [teamTotalMinutes, setTeamTotalMinutes] = useState(0);
  const [myTotalMinutes, setMyTotalMinutes] = useState(0);

  const [calculationResult, setCalculationResult] = useState(null);

  const currentUserId = session?.user?.id;

  const { data, isLoading, mutate } = useSWR("calculator-team-data", fetchTeamData, { refreshInterval: 2000 });

  useEffect(() => {
    if (!data) return;
    
    setAccountName(prev => {
      if (!prev && data.globalAccountName) return data.globalAccountName;
      return prev;
    });

    const profMap = {};
    data.profiles.forEach((p) => {
      profMap[p.id] = p.full_name || `Member (${p.id.slice(0, 6)})`;
    });
    setProfilesMap(profMap);

    const userTotals = {};
    let totalMins = 0;

    data.logs.forEach((log) => {
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) {
        userTotals[log.user_id] = (userTotals[log.user_id] || 0) + duration;
        totalMins += duration;
      }
    });

    setTeamLogs(data.logs);
    setTeamTotalMinutes(totalMins);

    if (currentUserId && userTotals[currentUserId]) {
      setMyTotalMinutes(userTotals[currentUserId]);
    } else {
      setMyTotalMinutes(0);
    }
  }, [data, currentUserId]);

  const saveAccountName = async () => {
    setIsSavingName(true);
    await supabase.from("team_settings").update({ account_name: accountName }).eq("id", 1);
    setIsSavingName(false);
  };

  const handleCopyReport = () => {
    if (!calculationResult) return;
    const myLogs = teamLogs.filter(log => log.user_id === currentUserId);
    const dailyTotals = {};
    
    myLogs.forEach(log => {
      const date = new Date(log.created_at);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
      const key = `${dayName} ${dateNum}`;
      const duration = (log.stop_minutes || 0) - (log.start_minutes || 0);
      if (duration > 0) dailyTotals[key] = (dailyTotals[key] || 0) + duration;
    });

    const myRow = calculationResult.breakdown.find(r => r.userId === currentUserId);
    if (!myRow) return;

    // Build array for strict line-by-line wrapping
    const reportLines = [
      `Name of account ${accountName}`,
      `My name  ${myRow.name}`,
      `` // Blank line
    ];

    Object.entries(dailyTotals).forEach(([dateStr, mins]) => {
      // Using spaces instead of tabs for universal alignment
      reportLines.push(`${dateStr}:      ${formatHHMMSS(mins)}`);
    });

    reportLines.push(``); // Blank line
    reportLines.push(`Total hours-  ${formatHHMMSS(myTotalMinutes)} or ${preciseRound(myTotalMinutes / 60)}`);
    reportLines.push(`Productive hours: ${myRow.payoutDecimalHours}`);

    // \r\n guarantees the text wraps line-under-line in all target applications
    const finalReport = reportLines.join("\r\n");

    navigator.clipboard.writeText(finalReport)
      .then(() => toast.success("Report copied to clipboard!"))
      .catch(err => toast.error("Failed to copy text: " + err.message));
  };

  const handleCalculate = (e) => {
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
  };

  return (
    <BaseCard
      title="Payout Calculator"
      subtitle="Calculate individual payout shares auto-synced with team database logs"
      headerAction={
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          title="Sync Latest Database Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <form onSubmit={handleCalculate} className="space-y-5">
        {/* Input 1: My Total Logged Time (Locked, Read-Only, Auto-Populated) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              My Total Logged Time
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              value={
                isLoading
                  ? "Loading..."
                  : `${minutesToHHMMString(myTotalMinutes)} (Auto-synced)`
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Input 2: Team Total Logged Time (Locked, Read-Only, Auto-Populated) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Team Total Logged Time
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              value={
                isLoading
                  ? "Loading..."
                  : `${minutesToHHMMString(teamTotalMinutes)} (Auto-synced)`
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Input: Account Name */}
        <div>
          <label
            htmlFor="accountNameInput"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Global Account Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="accountNameInput"
                type="text"
                placeholder="e.g. John's Upwork"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={saveAccountName}
              disabled={isSavingName}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {isSavingName ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input 3: Platform Paid Time (Single Active Editable Input) */}
        <div>
          <label
            htmlFor="platformTimeInput"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Platform Paid Time (HH:MM)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="platformTimeInput"
              type="text"
              placeholder="e.g. 40:00"
              value={platformTimeInput}
              onChange={(e) => setPlatformTimeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Calculate Action Button */}
        <button
          type="submit"
          disabled={calculating || isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <Calculator className="w-4 h-4" />
          <span>Calculate Payout</span>
        </button>
      </form>

      {/* Transparent Team-Wide Payout Breakdown Section */}
      {calculationResult && (
        <div className="mt-6 p-4 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-5 animate-in fade-in duration-200">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved Client Paid Pool
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                {calculationResult.platformHHMM}
              </div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">
                ({calculationResult.platformDecimalHours} decimal hours)
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{calculationResult.breakdown.length} Active Members</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors focus:outline-none"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Transparent Team Breakdown List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Transparent Team Payout Breakdown
            </div>

            {calculationResult.breakdown.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200/60 text-center text-xs text-slate-500">
                No time logs recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {calculationResult.breakdown.map((row) => (
                  <div
                    key={row.userId}
                    className={`p-3.5 sm:p-4 bg-white border rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${row.isCurrentUser
                        ? "border-blue-300 ring-1 ring-blue-100 bg-blue-50/20"
                        : "border-slate-200/70 hover:border-slate-300"
                      }`}
                  >
                    {/* User Info & Logged Time */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 ${row.isCurrentUser
                            ? "bg-blue-100 border-blue-200 text-blue-700"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{row.name}</span>
                          {row.isCurrentUser && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded uppercase tracking-wide">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Logged: <span className="font-medium text-slate-700">{row.userHHMM}</span> ({row.userDecimalHours} hrs)
                        </div>
                      </div>
                    </div>

                    {/* Share % and Dual Format Final Payout */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block">
                          {row.sharePercentage}% Share
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900 tracking-tight">
                          {row.payoutHHMM}
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          {row.payoutDecimalHours} hrs
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BaseCard>
  );
}
