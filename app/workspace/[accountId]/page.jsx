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

export default function WorkspacePage() {
  const params = useParams();
  const accountId = params?.accountId;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logger"); // "logger" | "calculator"

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
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Verifying session...</span>
        </div>
      </main>
    );
  }

  // Unauthenticated View: Render Auth.jsx centered on screen
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <header className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handshakers Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Team Time Tracking
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
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
      <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Dashboard Top Header */}
        <Header session={session} onSignOut={handleSignOut} />

        {/* Main Dashboard Content */}
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center w-full">
          <div className="@container max-w-xl mx-auto w-full space-y-6">
            {/* Visual Fuel Gauge Progress Bar synced with refreshKey */}
            <FuelGauge />

            {/* Segmented Control Tabs */}
            <div className="bg-slate-200/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 text-xs font-medium border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("logger")}
                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === "logger"
                    ? "bg-white text-blue-600 font-semibold shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Snap-On Task Logger</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("calculator")}
                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === "calculator"
                    ? "bg-white text-blue-600 font-semibold shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Payout Calculator</span>
              </button>
            </div>

            {/* Active Tab View Rendering synced with refreshKey */}
            <div className="w-full animate-in fade-in duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">
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
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/50 bg-slate-50">
          <p>Handshakers MVP &bull; Minimalist Light Design System</p>
        </footer>
      </main>
    </AccountProvider>
  );
}
