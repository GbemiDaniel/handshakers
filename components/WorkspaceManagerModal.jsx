import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner"; // Make sure your toast library is imported correctly

export default function WorkspaceManagerModal({ isOpen, onClose, onAccountCreated }) {
  const [accountName, setAccountName] = useState("");
  const [poolLimit, setPoolLimit] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setAccountName("");
    setPoolLimit(60);
    onClose();
  };

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    // Pre-Submission Validation
    if (!poolLimit || poolLimit <= 0) {
      toast.error("Pool limit must be greater than 0");
      console.error("Pool limit must be greater than 0");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create the account with strict parseInt weekly_pool_hours payload
      const { data: newAccount, error: accountError } = await supabase
        .from("accounts")
        .insert([{ 
          account_name: accountName.trim(),
          weekly_pool_hours: parseInt(poolLimit, 10)
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // 2. Link the current super admin to this new account
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { error: memberError } = await supabase
          .from("account_members")
          .insert([{
            account_id: newAccount.id,
            user_id: userData.user.id,
            role: "admin"
          }]);

        if (memberError) throw memberError;
      }

      toast.success("Workspace created successfully");
      setAccountName("");
      setPoolLimit(60);
      onAccountCreated();
      onClose();
    } catch (error) {
      console.error("Error creating workspace:", error);
      console.error("RAW SUPABASE ERROR:", error);
      toast.error("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100">
      {/* Backdrop Layer - Handles the outside click */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ease-in-out animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centering Container */}
      <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">

        {/* Modal Card - pointer-events-auto ensures clicks inside don't trigger the backdrop */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 ease-in-out">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create New Workspace</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Acme Corp Upwork"
                className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out placeholder:text-slate-400 dark:placeholder:text-slate-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate(e);
                }}
              />
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label htmlFor="poolLimit" className="text-sm font-medium text-slate-400">
                Weekly Pool Limit (Hours)
              </label>
              <input 
                id="poolLimit"
                type="number" 
                min="1"
                value={poolLimit}
                onChange={(e) => setPoolLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all w-full"
                placeholder="Default: 60"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate(e);
                }}
              />
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
              onClick={handleCreate}
              disabled={isLoading || !accountName.trim() || !poolLimit || Number(poolLimit) <= 0}
              className="inline-flex items-center justify-center h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "+ Create Workspace"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
} 