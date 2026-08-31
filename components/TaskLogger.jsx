"use client";

import React, { useState, useEffect, useCallback } from "react";
import BaseCard from "./BaseCard";
import { supabase } from "@/utils/supabase";
import { useLatestGlobalStop } from "@/hooks/useLatestGlobalStop";
import { toast } from "sonner";
import { useAccount } from "@/context/AccountContext";
import { useAdminStore } from "@/store/useAdminStore";
import { timeToTotalSeconds, secondsToHHMMString, secondsToSmartDisplay, getCurrentCycleBoundaries } from "@/utils/timeUtils";
import { Clock, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Undo2, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function TaskLogger({ session, onUpdate }) {
  const [activeTypists, setActiveTypists] = useState([]);
  const [stopTimeInput, setStopTimeInput] = useState("");
  const [isEndOfDay, setIsEndOfDay] = useState(false);
  const [userRole, setUserRole] = useState("member");
  const { activeAccount: contextAccount } = useAccount();
  const activeAccount = useAdminStore(state => 
    state.workspaces.find(w => w.id === contextAccount?.id)
  ) || contextAccount;

  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [isAggregatorOpen, setIsAggregatorOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [fieldError, setFieldError] = useState("");

  const poolLimitHours = activeAccount?.weekly_pool_hours ?? 0;
  const MAX_POOL_SECONDS = poolLimitHours * 3600;

  // Shared SWR hook: auto-polls the latest global stop time (in seconds) every 2s.
  // Shared cache key with FuelGauge — mutating here updates both components.
  const {
    data: lockedStartSeconds = 0,
    mutate: refreshLatestStop,
    isLoading: fetchingLatest,
  } = useLatestGlobalStop(activeAccount?.id);

  // Aggregator State & Math Engine
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (isAggregatorOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAggregatorOpen]);

  // Load from local storage on mount (Client-side safe)
  useEffect(() => {
    const cachedTasks = localStorage.getItem('handshakers_aggregator_tasks');
    if (cachedTasks) {
      try {
        setTasks(JSON.parse(cachedTasks));
      } catch (err) {
        console.error("Error parsing cached tasks", err);
      }
    }
    setIsLoaded(true); // Mark as loaded AFTER retrieval
  }, []);

  // Save to local storage on tasks change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('handshakers_aggregator_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const closeAggregatorModal = () => {
    setIsAggregatorOpen(false);
  };
  
  const parseToSeconds = (inputStr) => {
    if (!inputStr || typeof inputStr !== 'string') return 0;
    const trimmed = inputStr.trim();
    if (trimmed.includes(':')) {
      const [mins, secs] = trimmed.split(':');
      const parsedMins = parseInt(mins, 10);
      const parsedSecs = parseInt(secs, 10);
      if (isNaN(parsedMins) || isNaN(parsedSecs)) return 0;
      return (parsedMins * 60) + parsedSecs;
    } else {
      const parsed = parseInt(trimmed, 10);
      return isNaN(parsed) ? 0 : parsed * 60;
    }
  };
  
  // Zero Truncation: exact integer seconds accumulation — no rounding in the loop
  const totalSeconds = tasks.reduce((sum, task) => sum + task.seconds, 0);
  const displayHours = Math.floor(totalSeconds / 3600);
  const displayMins = Math.floor((totalSeconds % 3600) / 60);
  const displaySecs = totalSeconds % 60;

  /**
   * Calculates the projected stop time by adding exact accumulated task seconds
   * to the locked start seconds. Operates entirely in seconds — zero truncation.
   *
   * @param {number} startSeconds — Locked start time in total seconds.
   * @param {number} addedSeconds — Exact accumulated task seconds.
   * @returns {string} HH:MM or HH:MM:SS display string.
   */
  const calculateProjectedStop = (startSeconds, addedSeconds) => {
    const projectedStopSeconds = startSeconds + addedSeconds;

    // Removed 24-hour (86400) modulo to support absolute cumulative sprint hours
    return secondsToSmartDisplay(projectedStopSeconds);
  };

  const projectedStopTime = calculateProjectedStop(lockedStartSeconds, totalSeconds);

  const handleAddTask = (e) => {
    e.preventDefault();
    const isValidFormat = /^\d+(:[0-5]?\d)?$/.test(taskInput.trim());
    if (!isValidFormat) {
      return; 
    }
    const calculatedSeconds = parseToSeconds(taskInput);
    if (calculatedSeconds > 0) {
      setTasks([...tasks, { id: Date.now(), rawInput: taskInput, seconds: calculatedSeconds }]);
      setTaskInput('');
    }
  };

  const removeTask = (idToRemove) => {
    setTasks(tasks.filter(task => task.id !== idToRemove));
  };

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

    // Accept both HH:MM and HH:MM:SS formats
    const isValidFormat = /^(\d+):([0-5]\d)(:[0-5]\d)?$/.test(stopTimeInput.trim());
    if (!isValidFormat) {
      const msg = "Invalid format. Please enter time as HH:MM or HH:MM:SS (e.g., 20:45 or 20:45:30).";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    let newStopSeconds;
    try {
      newStopSeconds = timeToTotalSeconds(stopTimeInput);
    } catch (parseErr) {
      const msg = `Invalid time: ${parseErr.message}`;
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    if (newStopSeconds === 0) {
      const msg = "Invalid time format.";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    // Time Travel Validation: Stop time must be greater than current locked start time
    if (newStopSeconds <= lockedStartSeconds) {
      const timeTravelErr = "Stop time must be greater than the current locked start time.";
      setFieldError(timeTravelErr);
      toast.error(timeTravelErr);
      return;
    }

    // Pool Cap Validation: Stop time cannot exceed weekly pool limit
    if (newStopSeconds > MAX_POOL_SECONDS) {
      const maxDisplay = secondsToHHMMString(MAX_POOL_SECONDS);
      const capErr = `Cumulative pool limit exceeded! Stop time cannot exceed ${poolLimitHours}:00 (${MAX_POOL_SECONDS}s). Max allowable is ${maxDisplay}.`;
      setFieldError(capErr);
      toast.error(capErr);
      return;
    }

    setSubmitting(true);
    try {
      // Race Condition Pre-Flight: Query DB for the chronologically latest log
      // (ordered by created_at to match useLatestGlobalStop's corrected query)
      const { data: latestCheck, error: checkErr } = await supabase
        .from("time_logs")
        .select("stop_time_seconds, created_at")
        .eq("account_id", activeAccount?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (checkErr) throw checkErr;

      // Extract the absolute seconds from the DB, applying the cycle boundary check
      let latestDbSeconds = 0;
      if (latestCheck && latestCheck.length > 0) {
        const latestLog = latestCheck[0];
        const { pacificMidnightUTC } = getCurrentCycleBoundaries();
        const logCreatedAt = new Date(latestLog.created_at).getTime();

        // If the latest log is from the current cycle, use its stop_time_seconds
        // Otherwise, it resets to 0, exactly like useLatestGlobalStop
        if (logCreatedAt >= pacificMidnightUTC) {
          latestDbSeconds = latestLog.stop_time_seconds;
        }
      }

      // Abort if timeline collision detected
      if (latestDbSeconds > lockedStartSeconds) {
        // Optimistically update SWR cache with the collision value (in seconds)
        refreshLatestStop(latestDbSeconds, { revalidate: false });
        const collisionErr = "Timeline collision. Another user just logged time. Please refresh.";
        toast.error(collisionErr);
        setSubmitting(false);
        return;
      }

      // Execute Supabase insert with canonical seconds (Phase 2)
      const insertPayload = {
        account_id: activeAccount?.id,
        user_id: session.user.id,
        start_time_seconds: lockedStartSeconds,
        stop_time_seconds: newStopSeconds,
        is_end_of_day: isEndOfDay,
      };
      console.log("TRACE 1: TaskLogger Payload:", JSON.parse(JSON.stringify(insertPayload)));

      const { data: insertData, error: insertErr } = await supabase.from("time_logs").insert([
        insertPayload,
      ]).select();

      console.log("TRACE 2: Supabase Response:", { data: insertData, error: insertErr });

      if (insertErr) throw insertErr;

      toast.success(
        `Time log submitted successfully! Handoff logged from ${secondsToSmartDisplay(
          lockedStartSeconds
        )} to ${stopTimeInput}${isEndOfDay ? " (Final log for day)" : ""}.`
      );
      setStopTimeInput("");
      setIsEndOfDay(false);
      
      // Refresh global highest stop time for next handoff
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
        .select("id, start_time_seconds, stop_time_seconds")
        .eq("account_id", activeAccount?.id)
        .order("stop_time_seconds", { ascending: false })
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

  const rawRemainingHours = (MAX_POOL_SECONDS - (lockedStartSeconds || 0)) / 3600;
  const isOverLimit = rawRemainingHours < 0;
  const displayRemainingHours = Math.abs(rawRemainingHours).toFixed(1);

  const isLockedByOther = activeTypists.length > 0;

  return (
    <BaseCard
      title="Log Team Time"
      subtitle="Enter your stop time to pass on to the next person. Logged times are auto-synced with the team."
      headerAction={
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors ${
          isOverLimit 
            ? 'bg-red-50 dark:bg-red-950/60 border-red-100 dark:border-red-800/60 text-red-600 dark:text-red-400' 
            : 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-800/60 text-blue-600 dark:text-blue-400'
        }`}>
          <span>
            {isOverLimit 
              ? `${displayRemainingHours}h Over Limit` 
              : `${displayRemainingHours}h Pool Remaining`}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmitLog} className="space-y-5 w-full">
        {/* Input 1: Locked Start Time (Read-Only) */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              LOCKED START TIME
            </label>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              value={
                fetchingLatest
                  ? "Loading..."
                  : `${secondsToSmartDisplay(lockedStartSeconds)} (Auto-synced)`
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium font-mono tabular-nums cursor-not-allowed select-none transition-colors"
            />
          </div>
        </div>

        {/* Input 2: Open Stop Time with "." to ":" interception */}
        <div className="w-full">
          <label
            htmlFor="stopTimeInput"
            className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
          >
            STOP TIME (HH:MM or HH:MM:SS)
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
            <input
              id="stopTimeInput"
              type="text"
              placeholder={isLockedByOther ? `${activeTypists[0]} is typing...` : "e.g. 20:45 or 20:45:30"}
              value={stopTimeInput}
              onChange={handleStopTimeChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={isLockedByOther}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium font-mono tabular-nums focus:outline-none transition-all duration-200 ease-in-out ${
                isLockedByOther 
                  ? "cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 placeholder-slate-500 animate-pulse-glow" 
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 " + (fieldError ? "border-red-300 dark:border-red-800 focus-visible:ring-2 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1")
              }`}
            />
          </div>
          {fieldError && (
            <span className="block text-xs font-medium text-red-500 dark:text-red-400 mt-1.5 leading-snug">
              {fieldError}
            </span>
          )}

        </div>

        {/* Checkbox: End of Day Flag & Aggregator Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2.5">
            <input
              id="isEndOfDay"
              type="checkbox"
              checked={isEndOfDay}
              onChange={(e) => setIsEndOfDay(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer"
            />
            <label
              htmlFor="isEndOfDay"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none"
            >
              Mark as final log for the day
            </label>
          </div>
          
          <button 
            type="button" 
            onClick={() => setIsAggregatorOpen(true)} 
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer active:scale-95 border border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.4)] hover:border-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.7)] hover:bg-blue-900/40 transition-all duration-200 ease-in-out"
          >
            Task Aggregator
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={submitting || fetchingLatest}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-white font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Submit Time</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Admin Rollback Utility Button (Rendered only for admins) */}
        {userRole === "admin" && (
          <div className="pt-2 flex justify-center border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRollbackModal(true)}
              disabled={rollingBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/70 dark:hover:bg-red-950/40 active:scale-[0.97] px-3 py-1.5 rounded-lg border border-red-200/70 dark:border-red-900/60 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {rollingBack ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Last Entry</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Tailwind CSS Modal Overlay */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center border border-red-200 dark:border-red-900/60">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Confirm Rollback
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to delete the latest global team time log? This action cannot be undone and will reset the global start time.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 px-5 py-4 sm:px-6 flex items-center justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRollbackModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRollback}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-xl transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Task Aggregator Modal */}
      <AnimatePresence>
        {isAggregatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Task Aggregator</h3>
                <button type="button" onClick={() => setTasks([])} className="text-xs text-red-400 hover:text-red-300 transition-colors ml-auto mr-4">Clear All</button>
                <button
                  type="button"
                  onClick={closeAggregatorModal}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              
              <form onSubmit={handleAddTask} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 15 or 15:30"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </form>

              {tasks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 max-h-48 overflow-y-auto pr-1">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-md text-sm border border-slate-700">
                      <span>{task.rawInput}</span>
                      {index === tasks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 rounded"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total: <b className="text-white">{displayHours > 0 ? `${displayHours}h ` : ''}{displayMins > 0 ? `${displayMins}m ` : ''}{displaySecs}s</b></span>
                <span className="text-slate-400 text-sm">Stop Time: <span className="text-blue-400 font-semibold tracking-wide">{projectedStopTime}</span></span>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setStopTimeInput(projectedStopTime);
                  setTasks([]);
                  closeAggregatorModal();
                }}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply to Stop Time &rarr;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseCard>
  );
}
