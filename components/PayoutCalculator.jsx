"use client";
import React from "react";
import { toast } from "sonner";
import BaseCard from "./BaseCard";
import TimelineVisualizer from "./TimelineVisualizer";
import { Calculator, Clock, Lock, RefreshCw, Users, User, Copy, CalendarDays, CheckCircle2 } from "lucide-react";
import {
  usePayoutCalculator,
  preciseRound,
} from "@/hooks/usePayoutCalculator";
import { useAccount } from "@/context/AccountContext";
import { secondsToHHMMSSString } from "@/utils/timeUtils";

export default function PayoutCalculator({ session }) {
  const { activeAccount } = useAccount();
  const { state, setters, actions } = usePayoutCalculator({ session });
  const {
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
  } = state;
  const { setPlatformTimeInput, setPayCycle } = setters;
  const { calculatePayout, mutate } = actions;

  const currentUserId = session?.user?.id;
  const currentAccountName = activeAccount?.account_name || activeAccount?.name || "Unknown Account";

  const handleCopyReport = () => {
    if (!calculationResult) return;
    const myLogs = teamLogs.filter((log) => log.user_id === currentUserId);
    const dailyTotals = {};

    myLogs.forEach((log) => {
      const date = new Date(log.created_at);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
      const key = `${dayName} ${dateNum}`;
      const duration = (log.stop_time_seconds || 0) - (log.start_time_seconds || 0);
      if (duration > 0) dailyTotals[key] = (dailyTotals[key] || 0) + duration;
    });

    const myRow = calculationResult.breakdown.find((r) => r.userId === currentUserId);
    if (!myRow) return;

    // Build array for strict line-by-line wrapping
    const reportLines = [
      `Name of account ${currentAccountName}`,
      `My name  ${myRow.name}`,
      ``, // Blank line
    ];

    Object.entries(dailyTotals).forEach(([dateStr, secs]) => {
      // Using spaces instead of tabs for universal alignment
      reportLines.push(`${dateStr}:      ${secondsToHHMMSSString(secs)}`);
    });

    reportLines.push(``); // Blank line
    reportLines.push(`Total hours-  ${secondsToHHMMSSString(myTotalMinutes)} or ${preciseRound(myTotalMinutes / 3600)}`);
    reportLines.push(`Productive hours: ${myRow.payoutDecimalHours}`);

    // \r\n guarantees the text wraps line-under-line in all target applications
    const finalReport = reportLines.join("\r\n");

    navigator.clipboard.writeText(finalReport)
      .then(() => toast.success("Report copied to clipboard!"))
      .catch((err) => toast.error("Failed to copy text: " + err.message));
  };

  return (
    <div className="space-y-6">
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
        {hasPreviousData ? (
          <div className="flex flex-col items-center mb-6 w-full">
            <div className="w-full max-w-sm bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <button 
                type="button"
                onClick={() => setPayCycle('previous')} 
                className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${payCycle === 'previous' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/60 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${payCycle === 'previous' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                Previous Cycle
              </button>
              <button 
                type="button"
                onClick={() => setPayCycle('current')} 
                className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${payCycle === 'current' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/60 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
              >
                <Clock className={`w-3.5 h-3.5 ${payCycle === 'current' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                Current Cycle
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/60">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"/>
              {payCycle === 'current' ? `Logging: ${dateLabels?.current}` : `Payout for: ${dateLabels?.previous}`}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/50 backdrop-blur-md border border-blue-100/60 dark:border-blue-800/60 px-4 py-2 rounded-xl shadow-xs">
              <Clock className="w-4 h-4"/>
              Current Logging Cycle
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/60">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"/>
              {dateLabels?.current}
            </div>
          </div>
        )}

        <form onSubmit={calculatePayout} className="space-y-5">
          {/* Input 1: My Total Logged Time (Locked, Read-Only, Auto-Populated) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                My Total Logged Time
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={
                  isLoading
                    ? "Loading..."
                    : `${secondsToHHMMSSString(myTotalMinutes)} (Auto-synced)`
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium font-mono tabular-nums cursor-not-allowed select-none transition-colors"
              />
            </div>
          </div>

          {/* Input 2: Team Total Logged Time (Locked, Read-Only, Auto-Populated) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Team Total Logged Time
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={
                  isLoading
                    ? "Loading..."
                    : `${secondsToHHMMSSString(teamTotalMinutes)} (Auto-synced)`
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium font-mono tabular-nums cursor-not-allowed select-none transition-colors"
              />
            </div>
          </div>

          {/* Input 3: Platform Paid Time (Single Active Editable Input) */}
          <div>
            <label
              htmlFor="platformTimeInput"
              className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Platform Paid Time (HH:MM)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
              <input
                id="platformTimeInput"
                type="text"
                placeholder="e.g. 40:00"
                value={platformTimeInput}
                onChange={(e) => setPlatformTimeInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium font-mono tabular-nums placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out"
              />
            </div>
          </div>

          {/* Calculate Action Button */}
          <button
            type="submit"
            disabled={calculating || isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] disabled:opacity-60 text-white font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Payout</span>
          </button>
        </form>

        {/* Transparent Team-Wide Payout Breakdown Section */}
        {calculationResult && (
          <div className="mt-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-5 animate-in fade-in duration-200">
            {/* Header Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Approved Client Paid Pool
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 font-mono tabular-nums">
                  {calculationResult.platformHHMM}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                  ({calculationResult.platformDecimalHours} decimal hours)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{calculationResult.breakdown.length} Active Members</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97] transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </button>
              </div>
            </div>

            {/* Transparent Team Breakdown List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transparent Team Payout Breakdown
              </div>

              {calculationResult.breakdown.length === 0 ? (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  No time logs recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {calculationResult.breakdown.map((row) => (
                    <div
                      key={row.userId}
                      className={`p-3.5 sm:p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 ease-in-out ${
                        row.isCurrentUser
                          ? "border-blue-300 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-950/40 bg-blue-50/20 dark:bg-blue-950/20"
                          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* User Info & Logged Time */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 ${
                            row.isCurrentUser
                              ? "bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {row.isCurrentUser && (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.2 rounded uppercase tracking-wide">
                                You
                              </span>
                            )}
                            {row.status === 'inactive' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Logged: <span className="font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums">{row.userHHMM}</span> ({row.userDecimalHours} hrs)
                          </div>
                        </div>
                      </div>

                      {/* Share % and Dual Format Final Payout */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/60 inline-block font-mono tabular-nums">
                            {row.sharePercentage}% Share
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono tabular-nums">
                            {row.payoutHHMM}
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono tabular-nums">
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

      {/* Interactive Visual Timeline Section */}
      <TimelineVisualizer
        logs={teamLogs}
        profilesMap={profilesMap}
        totalMinutes={teamTotalMinutes}
      />
    </div>
  );
}
