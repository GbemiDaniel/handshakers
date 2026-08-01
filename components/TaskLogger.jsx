"use client";

import React, { useState, useEffect, useCallback } from "react";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { useLatestGlobalStop } from "@/hooks/useLatestGlobalStop";
import { toast } from "sonner";
import { Clock, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Sparkles, Undo2, AlertTriangle } from "lucide-react";

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
  const match = /^(\d+):([0-5]\d)$/.exec(trimmed);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

export default function TaskLogger({ session, onUpdate }) {
  const [activeTypists, setActiveTypists] = useState([]);
  const [stopTimeInput, setStopTimeInput] = useState("");
  const [isEndOfDay, setIsEndOfDay] = useState(false);
  const [userRole, setUserRole] = useState("member");

  const [showRollbackModal, setShowRollbackModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [fieldError, setFieldError] = useState("");

  // Maximum cumulative pool cap: 80 hours = 4800 minutes
  const MAX_POOL_MINUTES = 4800;

  // Shared SWR hook: auto-polls the latest global stop_minutes every 2s.
  // Shared cache key with FuelGauge — mutating here updates both components.
  const {
    data: lockedStartMinutes = 0,
    mutate: refreshLatestStop,
    isLoading: fetchingLatest,
  } = useLatestGlobalStop();

  // 1. Fetch user role from profiles table
  const fetchUserRole = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!error && data?.role) {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  }, [session]);

  // Fetch user role on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserRole();
  }, [fetchUserRole]);

  // Supabase Presence for live typing indicator
  useEffect(() => {
    if (!session?.user?.id || !session?.user?.email) return;

    const room = supabase.channel('logger_presence', {
      config: { presence: { key: session.user.id } },
    });

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        // Flatten the presence state to find users who are actively typing
        const typingUsers = Object.values(newState)
          .flat()
          .filter((user) => user.isTyping && user.email !== session.user.email)
          .map((user) => user.name);

        // Remove duplicates and update state
        setActiveTypists([...new Set(typingUsers)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(room); };
  }, [session]);

  const handleFocus = async () => {
    if (!session?.user?.email) return;
    const friendlyName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'A teammate';
    await supabase.channel('logger_presence').track({ 
      email: session.user.email, 
      name: friendlyName,
      isTyping: true 
    });
  };

  const handleBlur = async () => {
    if (!session?.user?.email) return;
    const friendlyName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'A teammate';
    await supabase.channel('logger_presence').track({ 
      email: session.user.email, 
      name: friendlyName,
      isTyping: false 
    });
  };

  // Intercept and replace "." with ":" automatically
  const handleStopTimeChange = (e) => {
    const rawValue = e.target.value;
    const sanitized = rawValue.replace(/\./g, ":");
    setStopTimeInput(sanitized);
    setFieldError("");
  };

  const handleSubmitLog = async (e) => {
    e?.preventDefault();
    setFieldError("");

    if (!session?.user?.id) {
      toast.error("Active user session required to log time.");
      return;
    }

    if (!stopTimeInput) {
      const msg = "Please enter a stop time.";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    // Strict regex validation for HH:MM format (e.g. 20:45 or 8:30)
    const isValidFormat = /^(\d+):([0-5]\d)$/.test(stopTimeInput.trim());
    if (!isValidFormat) {
      const msg = "Invalid format. Please enter time as HH:MM or H:MM (e.g., 20:45).";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    const newStopMinutes = timeToTotalMinutes(stopTimeInput);
    if (newStopMinutes === null) {
      const msg = "Invalid time format.";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    // Time Travel Validation: Stop time must be greater than current locked start time
    if (newStopMinutes <= lockedStartMinutes) {
      const timeTravelErr = "Stop time must be greater than the current locked start time.";
      setFieldError(timeTravelErr);
      toast.error(timeTravelErr);
      return;
    }

    // Pool Cap Validation: Stop time cannot exceed 4800 minutes (80 hours)
    if (newStopMinutes > MAX_POOL_MINUTES) {
      const maxHHMM = minutesToHHMMString(MAX_POOL_MINUTES);
      const capErr = `Cumulative pool limit exceeded! Stop time cannot exceed 80:00 (${MAX_POOL_MINUTES} mins). Max allowable is ${maxHHMM}.`;
      setFieldError(capErr);
      toast.error(capErr);
      return;
    }

    setSubmitting(true);
    try {
      // Race Condition Pre-Flight: Query DB for absolute latest stop_minutes
      const { data: latestCheck, error: checkErr } = await supabase
        .from("time_logs")
        .select("stop_minutes")
        .order("stop_minutes", { ascending: false })
        .limit(1);

      if (checkErr) throw checkErr;

      const latestDbMinutes =
        latestCheck && latestCheck.length > 0 ? latestCheck[0].stop_minutes : 0;

      // Abort if timeline collision detected
      if (latestDbMinutes > lockedStartMinutes) {
        // Optimistically update SWR cache with the collision value
        refreshLatestStop(latestDbMinutes, { revalidate: false });
        const collisionErr = "Timeline collision. Another user just logged time. Please refresh.";
        toast.error(collisionErr);
        setSubmitting(false);
        return;
      }

      // Execute Supabase insert with is_end_of_day boolean
      const insertPayload = {
        user_id: session.user.id,
        start_minutes: lockedStartMinutes,
        stop_minutes: newStopMinutes,
        is_end_of_day: isEndOfDay,
      };
      console.log("TRACE 1: TaskLogger Payload:", JSON.parse(JSON.stringify(insertPayload)));

      const { data: insertData, error: insertErr } = await supabase.from("time_logs").insert([
        insertPayload,
      ]).select();

      console.log("TRACE 2: Supabase Response:", { data: insertData, error: insertErr });

      if (insertErr) throw insertErr;

      toast.success(
        `Time log submitted successfully! Handoff logged from ${minutesToHHMMString(
          lockedStartMinutes
        )} to ${stopTimeInput}${isEndOfDay ? " (Final log for day)" : ""}.`
      );
      setStopTimeInput("");
      setIsEndOfDay(false);
      
      // Refresh global highest stop_minutes for next handoff
      await refreshLatestStop();

      // Part 2: Trigger global refresh for parent dashboard
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.message || "Failed to submit time log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Rollback Function
  const confirmRollback = async () => {
    if (userRole !== "admin") return;
    
    setShowRollbackModal(false);

    setRollingBack(true);

    try {
      // Find the latest entry in time_logs table
      const { data: latestRows, error: findErr } = await supabase
        .from("time_logs")
        .select("id, start_minutes, stop_minutes")
        .order("stop_minutes", { ascending: false })
        .limit(1);

      if (findErr) throw findErr;

      if (!latestRows || latestRows.length === 0) {
        toast.error("No time logs exist to rollback.");
        setRollingBack(false);
        return;
      }

      const latestId = latestRows[0].id;

      // Delete latest row
      const { error: deleteErr } = await supabase
        .from("time_logs")
        .delete()
        .eq("id", latestId);

      if (deleteErr) throw deleteErr;

      toast.success("Last global entry successfully rolled back!");
      await refreshLatestStop();

      // Part 2: Trigger global refresh for parent dashboard
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error during admin rollback:", err);
      toast.error(err.message || "Failed to rollback entry. Verify admin RLS permissions.");
    } finally {
      setRollingBack(false);
    }
  };

  const remainingPoolHours = ((MAX_POOL_MINUTES - lockedStartMinutes) / 60).toFixed(1);

  const isLockedByOther = activeTypists.length > 0;

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

        {/* Input 2: Open Stop Time with "." to ":" interception */}
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
              placeholder={isLockedByOther ? `${activeTypists[0]} is typing...` : "e.g. 20:45"}
              value={stopTimeInput}
              onChange={handleStopTimeChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={isLockedByOther}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-colors ${
                isLockedByOther 
                  ? "cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200 placeholder-slate-500" 
                  : "bg-white text-slate-900 placeholder-slate-400 " + (fieldError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-blue-600 focus:border-blue-600")
              }`}
            />
          </div>
          {fieldError && (
            <span className="block text-xs font-medium text-red-500 mt-1.5 leading-snug">
              {fieldError}
            </span>
          )}
        </div>

        {/* Checkbox: End of Day Flag */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <input
            id="isEndOfDay"
            type="checkbox"
            checked={isEndOfDay}
            onChange={(e) => setIsEndOfDay(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
          />
          <label
            htmlFor="isEndOfDay"
            className="text-sm font-medium text-slate-500 cursor-pointer select-none"
          >
            Mark as final log for the day
          </label>
        </div>

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

        {/* Admin Rollback Utility Button (Rendered only for admins) */}
        {userRole === "admin" && (
          <div className="pt-2 flex justify-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRollbackModal(true)}
              disabled={rollingBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50/60 px-3 py-1.5 rounded-lg border border-red-200/60 transition-colors focus:outline-none"
            >
              {rollingBack ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Rollback Last Global Entry</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Tailwind CSS Modal Overlay */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Rollback
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Are you sure you want to delete the latest global team time log? This action cannot be undone and will reset the global start time.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-4 sm:px-6 flex items-center justify-end gap-3 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRollback}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
