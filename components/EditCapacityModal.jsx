import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";

export default function EditCapacityModal({ isOpen, onClose, workspace }) {
  const router = useRouter();
  const [poolLimit, setPoolLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && workspace) {
      setPoolLimit(workspace.weekly_pool_hours ?? 0);
    }
  }, [isOpen, workspace]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !workspace) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Strict validation for a valid integer, with a fallback to 0
    let parsedLimit = parseInt(poolLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      parsedLimit = 0;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({ weekly_pool_hours: parsedLimit })
        .eq('id', workspace.id)
        .select('id')
        .single();

      if (error) throw error;

      toast.success("Workspace capacity updated successfully");
      
      // Optimistically update the store
      useAdminStore.getState().updateWorkspaceOptimistic(workspace.id, { weekly_pool_hours: parsedLimit });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Mutation Error:", error);
      toast.error("Failed to update capacity. Check your permissions.");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop Layer */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ease-in-out animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centering Container */}
      <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">

        {/* Modal Card */}
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 ease-in-out">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Edit Workspace Capacity</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="editPoolLimit" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Weekly Pool Limit (Hours)
              </label>
              <input 
                id="editPoolLimit"
                type="number" 
                min="0"
                value={poolLimit}
                onChange={(e) => setPoolLimit(e.target.value)}
                className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="e.g. 60"
                required
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdate(e);
                }}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Setting this to 0 will restrict taskers from logging time.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 h-10 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isLoading || poolLimit === ""}
              className="inline-flex items-center justify-center h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
