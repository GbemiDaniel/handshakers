"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Auth from "@/components/Auth";
import PayoutCalculator from "@/components/PayoutCalculator";
import TaskLogger from "@/components/TaskLogger";
import FuelGauge from "@/components/FuelGauge";
import DailyLogs from "@/components/DailyLogs";
import Header from "@/components/Header";
import { AccountProvider } from "@/context/AccountContext";
import { supabase } from "@/utils/supabase";
import { Sparkles, Loader2, Clock, Calculator } from "lucide-react";
import Logo from "@/components/Logo";
import AppBootSequence from "@/components/AppBootSequence";
import StainedGlassMosaicBackground from "@/components/StainedGlassMosaicBackground";

export default function WorkspacePage() {
  const params = useParams();
  const accountId = params?.accountId;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logger"); // "logger" | "calculator"
  const [isShattering, setIsShattering] = useState(false); // Can be triggered globally or via DevTools

  // Global Refresh Key for realtime UI synchronization across child components
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for authentication changes (sign in, sign out, sign up)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Brief clean loading state while verifying initial auth session
  if (loading) {
    return <AppBootSequence/>;
  }

  // Unauthenticated View: Render Auth.jsx centered on screen
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-200 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <header className="text-center space-y-2.5">
            <div className="flex justify-center mb-6">
              <Logo className="w-10 h-10" showText={true} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team Time Tracking
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Sign in to manage team time logs and prorated payout calculations.
            </p>
          </header>

          <Auth onAuthSuccess={(sess) => setSession(sess)} />
        </div>
      </main>
    );
  }

  // Authenticated Dashboard Layout with AccountProvider Context
  return (
    <AccountProvider session={session}>
      <main className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        <StainedGlassMosaicBackground />
        
        {/* Content Layer — must sit above z-0 ambient background */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Dashboard Top Header */}
          <Header session={session} onSignOut={handleSignOut} />

          {/* Main Dashboard Content */}
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center w-full">
            <div className="@container max-w-xl mx-auto w-full space-y-6">
              {/* Visual Fuel Gauge Progress Bar synced with refreshKey */}
              <FuelGauge />

              {/* Segmented Control Tabs */}
              <div className="bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab("logger")}
                  className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeTab === "logger"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Snap-On Task Logger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("calculator")}
                  className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeTab === "calculator"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Payout Calculator</span>
                </button>
              </div>

              {/* Active Tab View Rendering synced with refreshKey */}
              <div className="w-full animate-in fade-in duration-200 ease-in-out">
                {activeTab === "logger" ? (
                  <div className="space-y-6 w-full">
                    <TaskLogger session={session} onUpdate={handleUpdate} />
                    <DailyLogs session={session} refreshKey={refreshKey} />
                  </div>
                ) : (
                  <PayoutCalculator session={session} refreshKey={refreshKey} />
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Footer */}
          <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
              Handshakers MVP &bull; Engineered by Dee
            </p>
          </footer>
        </div>
      </main>
    </AccountProvider>
  );
}
