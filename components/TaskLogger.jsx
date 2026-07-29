"use client";

import React, { useState, useEffect, useCallback } from "react";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { Clock, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

/**
 * Converts raw total minutes into an HH:MM string for display.
 * (e.g. 1245 -> "20:45", 0 -> "00:00")
 */
function minutesToHHMMString(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return "00:00";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${formattedHours}:${formattedMins}`;
}

/**
 * Converts an HH:MM string into raw Total Minutes.
 * (e.g. "20:45" -> 1245)
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

export default function TaskLogger({ session }) {
  const [lockedStartMinutes, setLockedStartMinutes] = useState(0);
  const [stopTimeInput, setStopTimeInput] = useState("");

  const [fetchingLatest, setFetchingLatest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Maximum cumulative pool cap: 80 hours = 4800 minutes
  const MAX_POOL_MINUTES = 4800;

  // Query time_logs for highest stop_minutes across the team
  const fetchLatestGlobalTime = useCallback(async () => {
    setFetchingLatest(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("time_logs")
        .select("stop_minutes")
        .order("stop_minutes", { ascending: false })
        .limit(1);

      if (fetchErr) {
        console.error("Error fetching latest global time log:", fetchErr.message);
      }

      if (data && data.length > 0 && data[0].stop_minutes !== undefined) {
        setLockedStartMinutes(data[0].stop_minutes);
      } else {
        setLockedStartMinutes(0);
      }
    } catch (err) {
      console.error("Unexpected error fetching latest global time:", err);
    } finally {
      setFetchingLatest(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestGlobalTime();
  }, [fetchLatestGlobalTime]);

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!session?.user?.id) {
      setError("Active user session required to log time.");
      return;
    }

    const newStopMinutes = timeToTotalMinutes(stopTimeInput);

    // Validation 1: Format validation
    if (newStopMinutes === null) {
      setError('Please enter a valid "New Stop Time" in HH:MM format (e.g. 21:30).');
      return;
    }

    // Validation 2: New Stop Minutes must be greater than Locked Start Minutes
    if (newStopMinutes <= lockedStartMinutes) {
      setError(
        `New Stop Time (${stopTimeInput} / ${newStopMinutes} mins) must be greater than Locked Start Time (${minutesToHHMMString(
          lockedStartMinutes
        )} / ${lockedStartMinutes} mins). Cannot log backwards in time.`
      );
      return;
    }

    // Validation 3: New Stop Minutes must be <= 4800 (80-hour pool cap)
    if (newStopMinutes > MAX_POOL_MINUTES) {
      const maxHHMM = minutesToHHMMString(MAX_POOL_MINUTES);
      setError(
        `Cumulative pool limit exceeded! Stop time cannot exceed 80:00 (${MAX_POOL_MINUTES} mins). Max allowable is ${maxHHMM}.`
      );
      return;
    }

    // Submit new log to Supabase time_logs table
    setSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from("time_logs").insert([
        {
          user_id: session.user.id,
          start_minutes: lockedStartMinutes,
          stop_minutes: newStopMinutes,
        },
      ]);

      if (insertErr) throw insertErr;

      setSuccess(
        `Time log submitted successfully! Handoff logged from ${minutesToHHMMString(
          lockedStartMinutes
        )} to ${stopTimeInput}.`
      );
      setStopTimeInput("");
      
      // Refresh global highest stop_minutes for next handoff
      await fetchLatestGlobalTime();
    } catch (err) {
      setError(err.message || "Failed to submit time log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const remainingPoolMinutes = MAX_POOL_MINUTES - lockedStartMinutes;
  const remainingPoolHours = (remainingPoolMinutes / 60).toFixed(2);

  return (
    <BaseCard
      title="Snap-On Task Logger"
      subtitle="Log continuous team time blocks adhering to the 80-hour cumulative pool"
      headerAction={
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{remainingPoolHours}h Pool Remaining</span>
        </div>
      }
    >
      <form onSubmit={handleSubmitLog} className="space-y-5 w-full">
        {/* Input 1: Locked Start Time (Read-Only) */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Locked Start Time (Snap-on Handoff)
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {lockedStartMinutes} raw mins
            </span>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              value={
                fetchingLatest
                  ? "Loading..."
                  : `${minutesToHHMMString(lockedStartMinutes)} (Auto-synced)`
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Input 2: Open Stop Time */}
        <div className="w-full">
          <label
            htmlFor="stopTimeInput"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            New Stop Time (HH:MM)
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="stopTimeInput"
              type="text"
              placeholder="e.g. 20:45"
              value={stopTimeInput}
              onChange={(e) => setStopTimeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="w-full flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs font-medium text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{error}</span>
          </div>
        )}

        {success && (
          <div className="w-full flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug break-words">{success}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={submitting || fetchingLatest}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Submit Handoff Log</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </BaseCard>
  );
}
