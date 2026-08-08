"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { LogOut, User } from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import AccountSwitcher from "./AccountSwitcher";

export default function Header({ session, onSignOut }) {
  const [userName, setUserName] = useState("");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

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
  }, [session?.user?.id]);

  useEffect(() => {
    fetchName();
  }, [fetchName]);

  const displayName = userName || session?.user?.email?.split("@")[0] || "Team Member";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 h-14 sm:h-16 max-w-7xl mx-auto">
          {/* Logo & Workspace Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              H
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight hidden md:inline">
              Handshakers
            </span>
            <span className="text-slate-300 hidden md:inline">/</span>
            <AccountSwitcher />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsProfileSettingsOpen(true)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:pr-3 sm:bg-slate-50 sm:border sm:border-slate-200/80 rounded-full cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              title="Open Profile Settings"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-[120px] md:max-w-[200px]">
                {displayName}
              </span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Settings Slide-out Drawer */}
      <ProfileSettings
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        session={session}
        onProfileUpdate={fetchName}
      />
    </>
  );
}
