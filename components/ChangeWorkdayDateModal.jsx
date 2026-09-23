"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, X } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { formatWorkDate } from "@/utils/timeUtils";

/**
 * Re-dates one workday for a workspace admin. `day` carries the day's first
 * entry id, its current date and the range that keeps days in order; the
 * set_workday_date RPC enforces the same rules server-side.
 */
export default function ChangeWorkdayDateModal({ day, accountId, onClose, onSaved }) {
  const [value, setValue] = useState(day?.workDate ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!day) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [day, saving, onClose]);

  if (!day) return null;

  const outOfRange = !value || value < day.minDate || value > day.maxDate;
  const unchanged = value === day.workDate;

  const handleSave = async () => {
    if (outOfRange || unchanged) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("set_workday_date", {
        p_account_id: accountId,
        p_log_id: day.firstLogId,
        p_work_date: value,
      });
      if (error) throw error;
      toast.success(`Day moved to ${formatWorkDate(value)}.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Couldn't change the date. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const rangeText = day.minDate
    ? `Between ${formatWorkDate(day.minDate)} and ${formatWorkDate(day.maxDate)}.`
    : `On or before ${formatWorkDate(day.maxDate)}.`;

  return (
    <div className="fixed inset-0 z-100">
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
        onClick={() => !saving && onClose()}
        aria-hidden="true"
      />
      <div className="flex items-center justify-center min-h-full p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-workday-date-title"
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl pointer-events-auto border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 id="change-workday-date-title" className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              Change workday date
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-2">
            <label htmlFor="workdayDate" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <CalendarDays className="w-4 h-4" />
              </div>
              <input
                id="workdayDate"
                type="date"
                value={value}
                min={day.minDate || undefined}
                max={day.maxDate}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                className="w-full min-w-0 h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100 dark:scheme-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {rangeText} Moves {day.entryCount === 1 ? "the entry" : `all ${day.entryCount} entries`} in this day.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 h-10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || outOfRange || unchanged}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
