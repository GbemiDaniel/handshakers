"use client";

import React, { useState } from "react";
import BaseCard from "./BaseCard";
import { Calculator, Clock, AlertCircle, Sparkles, RefreshCw } from "lucide-react";

/**
 * Converts HH:MM string into Total Minutes.
 * Formula: (Parsed Hours * 60) + Parsed Minutes
 */
function timeToTotalMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();

  // Match HH:MM format (e.g. "16:20", "0:45", "120:00")
  const match = /^(\d+):([0-5]?\d)$/.exec(trimmed);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Converts raw total minutes back into formatted hours and minutes.
 * Hours: Math.floor(Final Minutes / 60)
 * Remaining Minutes: Math.round(Final Minutes % 60)
 */
function minutesToHHMM(finalMinutesFloat) {
  if (finalMinutesFloat === null || isNaN(finalMinutesFloat) || finalMinutesFloat < 0) {
    return null;
  }

  const roundedTotalMinutes = Math.round(finalMinutesFloat);
  let hours = Math.floor(roundedTotalMinutes / 60);
  let minutes = roundedTotalMinutes % 60;

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return {
    hours,
    minutes,
    totalMinutes: roundedTotalMinutes,
    displayFormatted: `${hours}h ${formattedMinutes}m`,
    timeString: `${hours}:${formattedMinutes}`,
  };
}

export default function PayoutCalculator() {
  const [myTime, setMyTime] = useState("");
  const [teamTime, setTeamTime] = useState("");
  const [platformTime, setPlatformTime] = useState("");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = (e) => {
    e?.preventDefault();
    setError("");
    setResult(null);

    // 1. Convert each HH:MM string into Total Integer Minutes (High-Precision Math Engine)
    const myMinutes = timeToTotalMinutes(myTime);
    const teamMinutes = timeToTotalMinutes(teamTime);
    const platformMinutes = timeToTotalMinutes(platformTime);

    // Input Validation
    if (myMinutes === null) {
      setError('Please enter a valid "My Total Logged Time" in HH:MM format (e.g., 16:20).');
      return;
    }

    if (teamMinutes === null) {
      setError('Please enter a valid "Team Total Logged Time" in HH:MM format (e.g., 50:00).');
      return;
    }

    if (platformMinutes === null) {
      setError('Please enter a valid "Platform Paid Time" in HH:MM format (e.g., 40:00).');
      return;
    }

    if (teamMinutes === 0) {
      setError("Team Total Logged Time must be greater than zero to calculate prorated share.");
      return;
    }

    // 2. Execute prorate formula using total integer minutes:
    // (My Total Minutes / Team Total Minutes) * Paid Total Minutes
    const finalPayoutMinutes = (myMinutes / teamMinutes) * platformMinutes;

    // 3. Convert final payout minutes back to HH:MM format
    const formattedResult = minutesToHHMM(finalPayoutMinutes);

    // 4. Calculate decimal hours for display outputs: (Total Minutes / 60).toFixed(2)
    const finalDecimalHours = (finalPayoutMinutes / 60).toFixed(2);
    const myDecimalHours = (myMinutes / 60).toFixed(2);
    const teamDecimalHours = (teamMinutes / 60).toFixed(2);
    const platformDecimalHours = (platformMinutes / 60).toFixed(2);
    const sharePercentage = ((myMinutes / teamMinutes) * 100).toFixed(2);

    setResult({
      myMinutes,
      teamMinutes,
      platformMinutes,
      finalPayoutMinutes,
      finalDecimalHours,
      myDecimalHours,
      teamDecimalHours,
      platformDecimalHours,
      formatted: formattedResult,
      sharePercentage,
    });
  };

  const handleReset = () => {
    setMyTime("");
    setTeamTime("");
    setPlatformTime("");
    setResult(null);
    setError("");
  };

  return (
    <BaseCard
      title="Prorated Payout Calculator"
      subtitle="Calculate individual payout share using high-precision minute math"
      headerAction={
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          title="Reset Form"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      <form onSubmit={handleCalculate} className="space-y-5">
        {/* Input 1: My Total Logged Time */}
        <div>
          <label
            htmlFor="myTime"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            My Total Logged Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="myTime"
              type="text"
              placeholder="16:20"
              value={myTime}
              onChange={(e) => setMyTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Input 2: Team Total Logged Time */}
        <div>
          <label
            htmlFor="teamTime"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Team Total Logged Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="teamTime"
              type="text"
              placeholder="50:00"
              value={teamTime}
              onChange={(e) => setTeamTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Input 3: Platform Paid Time */}
        <div>
          <label
            htmlFor="platformTime"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Platform Paid Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="platformTime"
              type="text"
              placeholder="40:00"
              value={platformTime}
              onChange={(e) => setPlatformTime(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs font-medium text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Calculate Action Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <Calculator className="w-4 h-4" />
          <span>Calculate Payout</span>
        </button>
      </form>

      {/* Conditionally Rendered Refined Result & Math Breakdown Block */}
      {result && (
        <div className="mt-6 p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-6 animate-in fade-in duration-200">
          {/* Dual Format Final Result Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Final Productive Hours
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {result.formatted?.displayFormatted}
              </div>
              <div className="text-sm font-medium text-slate-500 mt-1">
                {result.finalDecimalHours} hours
              </div>
            </div>

            <div className="self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {result.sharePercentage}% Share
              </span>
            </div>
          </div>

          {/* Analytical Math Breakdown Grid (Rebalanced 3-Pill Layout) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Analytical Math Breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: My Converted Decimal Hours */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  My Converted
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {result.myDecimalHours}{" "}
                  <span className="text-xs font-normal text-slate-500">hrs</span>
                </div>
              </div>

              {/* Metric 2: Team Converted Decimal Hours */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Team Converted
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {result.teamDecimalHours}{" "}
                  <span className="text-xs font-normal text-slate-500">hrs</span>
                </div>
              </div>

              {/* Metric 3: Calculated Share */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Calculated Share
                </div>
                <div className="text-base font-semibold text-blue-600">
                  {result.sharePercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
