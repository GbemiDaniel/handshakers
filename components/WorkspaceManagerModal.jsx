import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner"; // Make sure your toast library is imported correctly

export default function WorkspaceManagerModal({ isOpen, onClose, onAccountCreated }) {
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    setIsLoading(true);
    try {
      // 1. Create the account
      const { data: newAccount, error: accountError } = await supabase
        .from("accounts")
        .insert([{ account_name: accountName.trim() }])
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
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop Layer - Handles the outside click */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering Container */}
      <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">

        {/* Modal Card - pointer-events-auto ensures clicks inside don't trigger the backdrop */}
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Create New Workspace</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Acme Corp Upwork"
              className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-slate-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate(e);
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50/80 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 active:scale-[0.98] rounded-xl transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading || !accountName.trim()}
              className="inline-flex items-center justify-center h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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