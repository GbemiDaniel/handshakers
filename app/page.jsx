"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Auth from "@/components/Auth";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "@/components/WorkspaceManagerModal";
import { supabase } from "@/utils/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Loader2, Building, Plus, ArrowRight } from "lucide-react";

function CommandCenter() {
  const router = useRouter();
  const { accounts, isSuperAdmin, isLoadingAccounts, refreshAccounts } = useAccount();
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  useEffect(() => {
    if (isLoadingAccounts) return;
    if (!isSuperAdmin && accounts.length === 1) {
      router.push('/workspace/' + accounts[0].id);
    }
  }, [accounts, isSuperAdmin, isLoadingAccounts, router]);

  if (isLoadingAccounts) {
    return (
      <div className="py-12 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium">Loading your workspaces...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Workspaces Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Select a workspace to access its dedicated team time logger and payout calculator.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        )}
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => router.push(`/workspace/${account.id}`)}
            className="group text-left bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 rounded-2xl p-6 shadow-xs transition-all duration-200 ease-in-out flex flex-col justify-between h-44 relative overflow-hidden"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {account.account_name || account.name || "Workspace"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Enter Command Center
              </p>
            </div>
          </button>
        ))}

        {!isSuperAdmin && accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            You don&apos;t have access to any workspaces yet.
          </div>
        )}
      </div>

      <WorkspaceManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onAccountCreated={refreshAccounts}
      />
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading OS...</span>
        </div>
      </main>
    );
  }

  // Unauthenticated View
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>

          <header className="text-center space-y-2.5">
            <div className="flex justify-center mb-6">
              <Logo className="w-10 h-10" showText={true} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Global Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Sign in to manage your multi-tenant workspaces.
            </p>
          </header>

          <Auth onAuthSuccess={(sess) => setSession(sess)} />
        </div>
      </main>
    );
  }

  // Authenticated View
  return (
    <AccountProvider session={session}>
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Handshakers OS</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setSession(null);
              }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <CommandCenter />
      </main>
    </AccountProvider>
  );
}
