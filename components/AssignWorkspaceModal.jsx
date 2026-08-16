"use client";

import React, { useState, useEffect } from "react";
import { X, Building, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";

export default function AssignWorkspaceModal({ isOpen, onClose, tasker, full_name, onSuccess }) {
  const taskerName = full_name || tasker?.name || tasker?.full_name || "Tasker";
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchWorkspaces() {
      if (!isOpen || !tasker?.id) {
        // Reset state when closed
        setSelectedAccountId("");
        setWorkspaces([]);
        return;
      }
      
      setIsLoading(true);
      try {
        // 1. Fetch all accounts
        const { data: allAccounts, error: accountsErr } = await supabase
          .from('accounts')
          .select('id, account_name');
          
        if (accountsErr) throw accountsErr;

        // 2. Fetch the current tasker's existing active memberships
        const { data: userMemberships, error: membersErr } = await supabase
          .from('account_members')
          .select('account_id')
          .eq('user_id', tasker.id)
          .eq('status', 'active'); // Assuming we only care about currently active assignments

        if (membersErr) throw membersErr;

        // 3. Filter out accounts the user is already in
        const existingAccountIds = userMemberships.map(m => m.account_id);
        const availableWorkspaces = (allAccounts || []).filter(
          account => !existingAccountIds.includes(account.id)
        );

        setWorkspaces(availableWorkspaces);
      } catch (error) {
        console.error("Error fetching available workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaces();
  }, [isOpen, tasker?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ease-in-out animate-in fade-in"
        onClick={() => {
          setSelectedAccountId("");
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Centering Container */}
      <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">
        {/* Modal Card */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 ease-in-out">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                Assign {taskerName} to Workspace
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedAccountId("");
                onClose();
              }}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Choose which workspace you want to assign this tasker to.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Target Workspace
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading || isSubmitting}
              >
                <option value="" disabled>
                  {isLoading ? "Loading workspaces..." : "Select a workspace..."}
                </option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.account_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedAccountId("");
                onClose();
              }}
              disabled={isSubmitting}
              className="px-4 h-10 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (!selectedAccountId || !tasker?.id) return;
                
                setIsSubmitting(true);
                try {
                  const { error } = await supabase
                    .from('account_members')
                    .upsert([
                      {
                        account_id: selectedAccountId,
                        user_id: tasker.id,
                        role: 'member',
                        status: 'active'
                      }
                    ], { onConflict: 'account_id, user_id' });

                  if (error) throw error;

                  // Find the assigned workspace to include its name in the optimistic payload
                  const assignedWorkspace = workspaces.find(w => w.id === selectedAccountId);
                  
                  const newMembershipRecord = {
                    account_id: selectedAccountId,
                    status: 'active',
                    user_id: tasker.id,
                    accounts: assignedWorkspace ? { account_name: assignedWorkspace.account_name } : null
                  };
                  
                  // Zustand Optimistic UI Engine
                  useAdminStore.getState().assignTaskerOptimistic(tasker.id, newMembershipRecord);

                  toast.success(`${taskerName} successfully assigned!`);
                  
                  if (onSuccess) {
                    // We can still call onSuccess if parent needs to do anything else,
                    // but the UI will update instantly via Zustand.
                    await onSuccess();
                  }
                  
                  setSelectedAccountId("");
                  onClose();
                  
                } catch (error) {
                  console.error("Error assigning tasker:", error);
                  toast.error(error.message || "Failed to assign tasker.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!selectedAccountId || isSubmitting}
              className={`inline-flex items-center justify-center h-10 px-5 text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 gap-1.5 ${
                (!selectedAccountId || isSubmitting)
                  ? "bg-blue-400 dark:bg-blue-600/50 cursor-not-allowed opacity-70"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
