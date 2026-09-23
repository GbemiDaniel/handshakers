"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { LogOut, User, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "./WorkspaceManagerModal";
import ManageTeamModal from "./ManageTeamModal";
import EditCapacityModal from "./EditCapacityModal";
import { Plus, Users, Gauge } from "lucide-react";
import Logo from "./Logo";
import ProfileSettings from "./ProfileSettings";
import AccountSwitcher from "./AccountSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function Header({ session, onSignOut }) {
  const [userName, setUserName] = useState("");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const [isEditCapacityOpen, setIsEditCapacityOpen] = useState(false);
  const { isSuperAdmin, canManageAccount, activeAccount, refreshAccounts } = useAccount();
  const canManageActive = canManageAccount(activeAccount?.id);

  const fetchName = useCallback(async () => {
    if (session?.user?.id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      if (data?.full_name) {
        setUserName(data.full_name);
      }
    }
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchName();
  }, [fetchName]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const displayName = userName || session?.user?.email?.split("@")[0] || "Team Member";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Zone: Context & Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              href="/"
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shrink-0"
              title="Global Dashboard"
            >
              <Logo className="w-[clamp(1.25rem,2.5vw,1.75rem)] h-[clamp(1.25rem,2.5vw,1.75rem)] group-hover:scale-105 transition-transform duration-200" showText={true} />
            </Link>
          </div>

          {/* Right Zone: Switcher, Settings & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:block">
              <AccountSwitcher />
            </div>

            <ThemeToggle />

            {/* Desktop Settings (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-3 md:gap-4">

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsProfileSettingsOpen(true)}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Open Profile Settings"
              aria-label="User Profile Settings"
            >
              <User className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                aria-label="Toggle Mobile Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden fixed top-16 left-0 right-0 z-30 bg-white/90 backdrop-blur-md dark:bg-[#0B0F19]/95 border-t border-slate-200/60 dark:border-slate-800 shadow-xl"
          >
            <div className="flex flex-col px-0 py-6 gap-6">
              <AccountSwitcher isMobile={true} />

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileSettingsOpen(true);
                }}
                className="flex items-center gap-4 w-full px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
              >
                <User className="w-5 h-5 shrink-0" />
                <span>Profile Settings</span>
              </button>

              {canManageActive && (
                <>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsManageTeamModalOpen(true);
                      }}
                      className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full focus:outline-none"
                    >
                      <Users className="w-5 h-5 shrink-0" />
                      <span>Manage Team</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsEditCapacityOpen(true);
                    }}
                    className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full focus:outline-none"
                  >
                    <Gauge className="w-5 h-5 shrink-0" />
                    <span>Edit Capacity</span>
                  </button>
                </>
              )}

              {isSuperAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsManagerModalOpen(true);
                    }}
                    className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-blue-500 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-colors w-full focus:outline-none"
                  >
                    <Plus className="w-5 h-5 shrink-0" />
                    <span>Create Workspace</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
                className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full focus:outline-none"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Settings Slide-out Drawer */}
      <ProfileSettings
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        session={session}
        onProfileUpdate={fetchName}
      />
      
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
