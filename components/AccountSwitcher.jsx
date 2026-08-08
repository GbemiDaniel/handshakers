"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "./WorkspaceManagerModal";
import ManageTeamModal from "./ManageTeamModal";
import { Building, ChevronDown, Check, Loader2, Sparkles, Plus, Users } from "lucide-react";

export default function AccountSwitcher() {
  const router = useRouter();
  const {
    activeAccount,
    accounts,
    isSuperAdmin,
    isLoadingAccounts,
    refreshAccounts,
  } = useAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span>Loading account...</span>
      </div>
    );
  }

  const accountName = activeAccount?.account_name || activeAccount?.name || "Select Account";

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Account Switcher Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-3 h-3" />
          </div>
          <span className="truncate max-w-[120px] sm:max-w-[160px]">{accountName}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-[70] py-1.5 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspaces / Accounts
              </span>
              <Sparkles className="w-3 h-3 text-blue-500" />
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {accounts.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  No accounts available
                </div>
              ) : (
                accounts.map((account) => {
                  const isSelected = activeAccount?.id === account.id;
                  const name = account.account_name || account.name || `Account (${account.id.slice(0, 6)})`;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        router.push(`/workspace/${account.id}`);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors text-left ${
                        isSelected
                          ? "bg-blue-50/80 text-blue-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <Building className="w-3 h-3" />
                        </div>
                        <span className="truncate">{name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Super Admin Actions (Only renders if isSuperAdmin is true) */}
            {isSuperAdmin && (
              <div className="border-t border-slate-100 pt-1 mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsManageTeamModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manage Team</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsManagerModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/80 transition-colors text-left"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Manager Modal */}
      <WorkspaceManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onAccountCreated={refreshAccounts}
      />

      {/* Manage Team Modal */}
      <ManageTeamModal
        isOpen={isManageTeamModalOpen}
        onClose={() => setIsManageTeamModalOpen(false)}
        activeAccount={activeAccount}
      />
    </>
  );
}
