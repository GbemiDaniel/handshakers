"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "./WorkspaceManagerModal";
import ManageTeamModal from "./ManageTeamModal";
import EditCapacityModal from "./EditCapacityModal";
import { Building, ChevronDown, Check, Sparkles, Plus, Users, LayoutDashboard, Folder, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TelemetrySync from "@/components/TelemetrySync";

export default function AccountSwitcher({ isMobile = false }) {
  const router = useRouter();
  const {
    activeAccount,
    accounts,
    isSuperAdmin,
    canManageAccount,
    isLoadingAccounts,
    refreshAccounts,
  } = useAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const [isEditCapacityOpen, setIsEditCapacityOpen] = useState(false);
  const canManageActive = canManageAccount(activeAccount?.id);
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-400">
        <TelemetrySync />
        <span>Loading account...</span>
      </div>
    );
  }

  const accountName = activeAccount?.account_name || activeAccount?.name || "Select Account";

  return (
    <>
      <div className={`relative text-left ${isMobile ? 'block w-full' : 'inline-block'}`} ref={dropdownRef}>
        {/* Account Switcher Trigger Button */}
        <button
          type="button"
          onClick={() => isMobile ? setIsExpanded((prev) => !prev) : setIsOpen((prev) => !prev)}
          className={
            isMobile 
              ? "w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
              : "inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:scale-[0.98] border border-slate-200 dark:border-slate-700 rounded-xl text-[clamp(0.75rem,1vw,0.875rem)] font-semibold text-slate-800 dark:text-slate-200 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          }
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className={`flex items-center ${isMobile ? 'gap-4' : 'gap-2'} min-w-0`}>
            {!isMobile && (
              <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-800/60 flex items-center justify-center shrink-0">
                <Building className="w-3 h-3" />
              </div>
            )}
            {isMobile && <Folder className="w-5 h-5 shrink-0" />}
            <span className={isMobile ? "truncate" : "truncate max-w-30 sm:max-w-40"}>
              {isMobile ? "Workspaces" : accountName}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ease-in-out ${(isMobile ? isExpanded : isOpen) ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown / Accordion Menu */}
        {(isOpen || isMobile) && (
          <div className={
            isMobile 
              ? "mt-1 w-full flex flex-col" 
              : "absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl z-70 py-1.5 animate-in fade-in zoom-in-95 duration-200 ease-in-out"
          }>
            {!isMobile && (
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Workspaces / Accounts
                </span>
                <Sparkles className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              </div>
            )}

            <AnimatePresence>
              {(!isMobile || isExpanded) && (
                <motion.div
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={isMobile ? { height: "auto", opacity: 1 } : false}
                  exit={isMobile ? { height: 0, opacity: 0 } : false}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className={isMobile ? "overflow-hidden" : ""}
                >
                  <div className={`overflow-y-auto py-1 ${isMobile ? 'max-h-48 border-l-2 border-slate-200 dark:border-slate-700 ml-8 mt-2 space-y-1' : 'max-h-60'}`}>
                    {accounts.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center">
                        No accounts available
                      </div>
                    ) : (
                      (isMobile ? accounts.slice(0, 3) : accounts).map((account) => {
                        const isSelected = activeAccount?.id === account.id;
                        const name = account.account_name || account.name || `Account (${account.id.slice(0, 6)})`;
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => {
                              router.push(`/workspace/${account.id}`);
                              setIsOpen(false);
                              setIsExpanded(false);
                            }}
                            className={`w-full flex items-center justify-between py-2 transition-colors duration-150 ease-in-out text-left focus:outline-none ${
                              isMobile
                                ? `pl-5 pr-8 text-sm font-medium ${isSelected ? "text-blue-400" : "text-slate-400 hover:text-white"}`
                                : `px-3 text-xs font-medium ${isSelected ? "text-blue-700 dark:text-blue-300 font-semibold rounded-xl bg-blue-50/80 dark:bg-blue-950/60" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl"}`
                            }`}
                          >
                            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-2'} min-w-0`}>
                              {!isMobile && (
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-blue-600 dark:bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                }`}>
                                  <Building className="w-3 h-3" />
                                </div>
                              )}
                              {isMobile && <Building className="w-4 h-4 shrink-0" />}
                              <span className="truncate">{name}</span>
                            </div>
                            {isSelected && <Check className={`shrink-0 ${isMobile ? 'w-4 h-4 text-blue-400' : 'w-3.5 h-3.5 text-blue-600 dark:text-blue-400'}`} />}
                          </button>
                        );
                      })
                    )}
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setIsExpanded(false);
                          router.push("/");
                        }}
                        className="w-full flex items-center gap-3 py-2 pl-5 pr-8 text-sm font-medium text-slate-500 hover:text-white transition-colors duration-150 ease-in-out text-left focus:outline-none mt-1"
                      >
                        <LayoutDashboard className="w-4 h-4 shrink-0" />
                        <span className="truncate">View all workspaces</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Workspace admin actions: the super admin, or this workspace's lead.
                Membership itself is super-admin only. */}
            {!isMobile && canManageActive && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 space-y-0.5">
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsManageTeamModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150 ease-in-out text-left focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Manage Team</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsEditCapacityOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150 ease-in-out text-left focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800"
                >
                  <Gauge className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Edit Capacity</span>
                </button>
              </div>
            )}

            {!isMobile && isSuperAdmin && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsManagerModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/60 transition-colors duration-150 ease-in-out text-left focus:outline-none focus-visible:bg-blue-100/60 dark:focus-visible:bg-blue-950/80"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
            {/* Global Escape Hatch (Always visible on desktop) */}
            {!isMobile && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150 ease-in-out text-left focus:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>View all workspaces</span>
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

      <EditCapacityModal
        isOpen={isEditCapacityOpen}
        onClose={() => setIsEditCapacityOpen(false)}
        workspace={activeAccount}
      />
    </>
  );
}
